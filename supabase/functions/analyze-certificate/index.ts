// ============================================================
// Supabase Edge Function: analyze-certificate
// 교과과정 이수 증빙 파일을 OpenAI Vision으로 분석
//
// mode: 'extractGrade' → 이수표에서 학년(재학년도) 자동 추출
// mode: 없음(기본)    → 학생이 체크한 과목 목록과 자동 대조
//
// PDF는 프론트에서 이미지로 변환 후 전달받습니다.
// ============================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    const { mode, imageDataList, fileUrl, fileName, checkedCourses } = await req.json();

    if (!fileName) throw new Error("파일 이름이 없습니다.");
    if (!imageDataList && !fileUrl) throw new Error("이미지 데이터가 없습니다.");

    // 이미지 콘텐츠 구성 (공통)
    const imageContents: unknown[] = [];

    if (fileUrl) {
      imageContents.push({
        type: "image_url",
        image_url: { url: fileUrl, detail: "high" },
      });
    } else if (imageDataList && imageDataList.length > 0) {
      for (const imgData of imageDataList) {
        const base64 = imgData.includes("base64,")
          ? imgData.split("base64,")[1]
          : imgData;
        imageContents.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${base64}`,
            detail: "high",
          },
        });
      }
    }

    if (imageContents.length === 0) throw new Error("분석할 이미지가 없습니다.");

    // ── 학년 추출 모드 ──────────────────────────────────────────
    if (mode === "extractGrade") {
      const systemPrompt = `당신은 대학교 교과과정 이수표를 분석하는 전문가입니다.
이수표 문서에서 학생의 현재 학년(재학년도) 정보를 정확하게 추출해주세요.`;

      const userPrompt = `이 교과과정 이수표에서 학생의 학년(재학년도)을 추출해주세요.

추출 규칙:
1. 문서에 "2학년", "3학년", "4학년" 등의 학년 정보를 찾아주세요.
2. 학년이 숫자로만 적혀있으면 "N학년" 형태로 변환하세요. (예: "3" → "3학년")
3. 명확히 판단하기 어려운 경우 confidence를 "low"로 설정하세요.
4. 반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"grade": "3학년", "confidence": "high"}`;

      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            ...imageContents,
            { type: "text", text: userPrompt },
          ],
        },
      ];

      console.log(`[analyze-certificate] 학년 추출 시작: ${fileName}`);

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          max_tokens: 100,
          temperature: 0.1,
        }),
      });

      if (!openaiResponse.ok) {
        const errorBody = await openaiResponse.text();
        if (openaiResponse.status === 401) throw new Error("OpenAI API Key가 유효하지 않습니다.");
        if (openaiResponse.status === 429) throw new Error("OpenAI API 요청 한도를 초과했습니다.");
        throw new Error(`OpenAI API 오류 (${openaiResponse.status}): ${errorBody}`);
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI 응답이 비어 있습니다.");

      let gradeResult;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                          content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        gradeResult = JSON.parse(jsonStr.trim());
      } catch {
        throw new Error("AI 응답을 파싱할 수 없습니다.");
      }

      const validGrades = ["2학년", "3학년", "4학년"];
      if (!validGrades.includes(gradeResult.grade)) {
        throw new Error(`유효하지 않은 학년 값: ${gradeResult.grade}`);
      }

      console.log(`[analyze-certificate] 학년 추출 완료: ${gradeResult.grade} (신뢰도: ${gradeResult.confidence})`);

      return new Response(
        JSON.stringify({ success: true, data: gradeResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 기존 교과목 대조 모드 ──────────────────────────────────
    if (!checkedCourses || checkedCourses.length === 0) {
      throw new Error("체크된 과목 목록이 없습니다.");
    }

    const courseNameList = checkedCourses
      .map((c: { courseName: string; courseCode: string }, i: number) =>
        `${i + 1}. ${c.courseName} (${c.courseCode})`
      )
      .join("\n");

    const systemPrompt = `당신은 대학교 교과목 이수 증빙 서류를 분석하는 전문가입니다.
학생이 제출한 교과과정 이수표를 분석하여 주어진 과목 목록이 해당 서류에 나타나는지 확인해주세요.

분석 규칙:
1. 과목명이 완전히 일치하지 않아도 유사하면 "일치"로 판단하세요
2. 학수번호(과목코드)가 일치하면 우선적으로 "일치"로 판단하세요
3. 반드시 JSON 형식으로만 응답하세요`;

    const userPrompt = `다음 과목들이 첨부된 증빙 서류에 있는지 확인해주세요:

${courseNameList}

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "results": [
    {
      "courseName": "과목명",
      "courseCode": "학수번호",
      "found": true,
      "confidence": "high",
      "note": "비고(선택)"
    }
  ],
  "summary": {
    "totalChecked": 0,
    "foundCount": 0,
    "notFoundCount": 0,
    "documentType": "교과과정 이수표",
    "overallValid": true
  }
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          ...imageContents,
          { type: "text", text: userPrompt },
        ],
      },
    ];

    console.log(`[analyze-certificate] 분석 시작: ${fileName}, 이미지 ${imageContents.length}장, 과목수: ${checkedCourses.length}`);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      if (openaiResponse.status === 401) throw new Error("OpenAI API Key가 유효하지 않습니다.");
      if (openaiResponse.status === 429) throw new Error("OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
      if (openaiResponse.status === 400) throw new Error(`요청 오류: ${errorBody}`);
      throw new Error(`OpenAI API 오류 (${openaiResponse.status}): ${errorBody}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI 응답이 비어 있습니다.");

    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch {
      throw new Error("AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.");
    }

    console.log(`[analyze-certificate] 완료: ${analysisResult.summary?.foundCount}/${analysisResult.summary?.totalChecked}`);

    return new Response(
      JSON.stringify({ success: true, data: analysisResult, usage: openaiData.usage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-certificate] 오류:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "분석 중 오류가 발생했습니다." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
