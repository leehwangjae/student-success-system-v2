// ============================================================
// Supabase Edge Function: analyze-certificate
// 교과과정 이수 증빙 파일을 OpenAI Vision으로 분석하여
// 학생이 체크한 과목 목록과 자동 대조합니다.
// ============================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    const { fileData, fileName, checkedCourses } = await req.json();

    if (!fileData || !fileName) {
      throw new Error("파일 데이터가 없습니다.");
    }

    if (!checkedCourses || checkedCourses.length === 0) {
      throw new Error("체크된 과목 목록이 없습니다.");
    }

    // base64 데이터 정리 (data URL prefix 제거)
    const base64Data = fileData.includes("base64,")
      ? fileData.split("base64,")[1]
      : fileData;

    // 파일 타입 판별
    const fileNameLower = fileName.toLowerCase();
    let mimeType = "";
    let isImageFile = false;

    if (fileNameLower.endsWith(".pdf")) {
      mimeType = "application/pdf";
      isImageFile = false;
    } else if (fileNameLower.endsWith(".png")) {
      mimeType = "image/png";
      isImageFile = true;
    } else if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) {
      mimeType = "image/jpeg";
      isImageFile = true;
    } else {
      throw new Error("지원하지 않는 파일 형식입니다. (PDF, PNG, JPG만 가능)");
    }

    // 체크된 과목명 목록 생성
    const courseNameList = checkedCourses
      .map((c: { courseName: string; courseCode: string }, i: number) =>
        `${i + 1}. ${c.courseName} (${c.courseCode})`
      )
      .join("\n");

    // OpenAI Vision API 프롬프트
    const systemPrompt = `당신은 대학교 교과목 이수 증빙 서류를 분석하는 전문가입니다.
학생이 제출한 교과과정 이수표(성적표, 교과목 이수 내역서 등)를 분석하여,
주어진 과목 목록이 해당 서류에 나타나는지 확인해주세요.

분석 규칙:
1. 과목명이 완전히 일치하지 않아도 유사하면 "일치"로 판단하세요 (예: "생명공학개론" = "생명공학 개론")
2. 학수번호(과목코드)가 일치하면 우선적으로 "일치"로 판단하세요
3. 서류에서 읽을 수 없는 과목은 "확인불가"로 표시하세요
4. 반드시 JSON 형식으로만 응답하세요`;

    const userPrompt = `다음 과목들이 첨부된 증빙 서류에 있는지 확인해주세요:

${courseNameList}

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "results": [
    {
      "courseName": "과목명",
      "courseCode": "학수번호",
      "found": true 또는 false,
      "confidence": "high" 또는 "medium" 또는 "low",
      "note": "비고 (선택)"
    }
  ],
  "summary": {
    "totalChecked": 전체과목수,
    "foundCount": 발견된과목수,
    "notFoundCount": 발견안된과목수,
    "documentType": "서류유형 (예: 성적증명서, 교과목이수표 등)",
    "overallValid": true 또는 false
  },
  "rawText": "서류에서 추출한 주요 텍스트 (과목명 위주)"
}`;

    // OpenAI API 요청 구성
    let messages;

    if (isImageFile) {
      // 이미지 파일: Vision API 직접 사용
      messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ];
    } else {
      // PDF 파일: base64 인코딩된 PDF로 전송
      messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: "high",
              },
            },
          ],
        },
      ];
    }

    console.log(`[analyze-certificate] 분석 시작: ${fileName}, 과목수: ${checkedCourses.length}`);

    // OpenAI API 호출
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
        temperature: 0.1, // 일관된 결과를 위해 낮은 temperature
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      console.error("[analyze-certificate] OpenAI API 오류:", errorBody);

      // 에러 유형별 메시지
      if (openaiResponse.status === 401) {
        throw new Error("OpenAI API Key가 유효하지 않습니다. Supabase Secrets에서 OPENAI_API_KEY를 확인하세요.");
      } else if (openaiResponse.status === 429) {
        throw new Error("OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
      } else if (openaiResponse.status === 400) {
        throw new Error("파일이 너무 크거나 형식이 올바르지 않습니다. 파일 크기를 줄이거나 다른 형식으로 변환해주세요.");
      }
      throw new Error(`OpenAI API 오류 (${openaiResponse.status}): ${errorBody}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI 응답이 비어 있습니다.");
    }

    console.log("[analyze-certificate] AI 응답:", content.substring(0, 200));

    // JSON 파싱
    let analysisResult;
    try {
      // JSON 블록 추출 (```json ... ``` 형식 대응)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/\{[\s\S]*\}/);

      const jsonStr = jsonMatch
        ? (jsonMatch[1] || jsonMatch[0])
        : content;

      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("[analyze-certificate] JSON 파싱 실패:", content);
      throw new Error("AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.");
    }

    console.log(`[analyze-certificate] 분석 완료: 발견 ${analysisResult.summary?.foundCount}/${analysisResult.summary?.totalChecked}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: analysisResult,
        usage: openaiData.usage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[analyze-certificate] 오류:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "분석 중 오류가 발생했습니다.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
