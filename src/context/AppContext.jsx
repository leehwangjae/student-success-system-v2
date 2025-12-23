import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [notices, setNotices] = useState([]);
  const [programApplications, setProgramApplications] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [coreCourses, setCoreCourses] = useState([]);
  const [coreCoursesSubmissions, setCoreCoursesSubmissions] = useState([]);

  // Supabase에서 학생 데이터 로드
  const loadStudentsFromSupabase = async () => {
    try {
      console.log('📚 학생 데이터 로드 시작...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('account_type', 'student')
        .eq('status', 'approved');

      if (error) throw error;

      console.log('📊 Supabase에서 가져온 데이터:', data.length, '명');

      const formattedStudents = data.map(user => {
        // 디버깅용 로그
        if (user.username === '202411003') {
          console.log('🎯 장원영 학생 원본 데이터:', {
            id: user.id,
            username: user.username,
            core_courses_score: user.core_courses_score,
            core_subject_score: user.core_subject_score,
            industry_score: user.industry_score,
            non_curricular_score: user.non_curricular_score
          });
        }

        const student = {
          id: user.id,
          studentId: user.student_id || user.username,
          name: user.name,
          department: user.department,
          field: user.field || '바이오',
          grade: user.grade || 4,
          email: user.email,
          phone: user.phone,
          password: user.password,
          role: 'student',
          memo: user.memo || '',
          
          // 점수 처리 (두 컬럼 모두 확인!)
          nonCurricularScore: user.non_curricular_score || 0,
          coreSubjectScore: user.core_subject_score || user.core_courses_score || 0,  // ✅ 수정!
          coreCoursesScore: user.core_courses_score || 0,  // ✅ 추가!
          industryScore: user.industry_score || 0,
          
          // 총점 계산
          total: (user.non_curricular_score || 0) + 
                 (user.core_subject_score || user.core_courses_score || 0) +  // ✅ 수정!
                 (user.industry_score || 0),
          
          // 이력
          nonCurricularHistory: user.non_curricular_history || [],
          coreSubjectHistory: user.core_subject_history || [],
          industryHistory: user.industry_history || []
        };

        // 디버깅용 로그
        if (user.username === '202411003') {
          console.log('✨ 장원영 학생 포맷된 데이터:', {
            id: student.id,
            name: student.name,
            coreSubjectScore: student.coreSubjectScore,
            coreCoursesScore: student.coreCoursesScore,
            total: student.total
          });
        }

        return student;
      });

      console.log('✅ 학생 데이터 로드 완료:', formattedStudents.length, '명');
      setStudents(formattedStudents);
      
    } catch (error) {
      console.error('❌ 학생 데이터 로드 실패:', error);
    }
  };

  // Supabase에서 프로그램 데이터 로드
  const loadProgramsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPrograms = data.map(program => ({
        id: program.id,
        title: program.title,
        category: program.category,
        field: program.field,
        startDate: program.start_date,
        endDate: program.end_date,
        status: program.status,
        maxParticipants: program.max_participants,
        requiresFile: program.requires_file,
        score: program.score,
        description: program.description,
        imageUrl: program.image_url,
        attachedFiles: program.attached_files || []
      }));

      console.log('✅ 프로그램 데이터 로드 완료:', formattedPrograms.length);
      setPrograms(formattedPrograms);
    } catch (error) {
      console.error('프로그램 데이터 로드 실패:', error);
    }
  };

  // Supabase에서 공지사항 데이터 로드
  const loadNoticesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotices = data.map(notice => ({
        id: notice.id,
        title: notice.title,
        field: notice.field,
        content: notice.content,
        author: notice.author,
        date: notice.date,
        views: notice.views || 0,
        imageUrl: notice.image_url,
        attachedFiles: notice.attached_files || []
      }));

      console.log('✅ 공지사항 데이터 로드 완료:', formattedNotices.length);
      setNotices(formattedNotices);
    } catch (error) {
      console.error('공지사항 데이터 로드 실패:', error);
    }
  };

  // Supabase에서 프로그램 신청 데이터 로드
  const loadProgramApplicationsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('program_applications')
        .select('id, program_id, student_id, status, created_at, attached_files')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedApplications = data.map(app => ({
        id: app.id,
        programId: app.program_id,
        studentId: app.student_id,
        status: app.status,
        appliedDate: app.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        completedDate: null, // 완료일은 나중에 추가
        attachedFiles: app.attached_files || []
      }));

      console.log('✅ 프로그램 신청 데이터 로드 완료:', formattedApplications.length);
      setProgramApplications(formattedApplications);
    } catch (error) {
      console.error('프로그램 신청 데이터 로드 실패:', error);
    }
  };

  // 🔥 pending 상태 사용자 로드
  const loadPendingUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Pending 사용자 로드:', data?.length || 0);
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Pending 사용자 로드 실패:', error);
    }
  };

  // 로그인
  const login = async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
      }

      if (data.status === 'pending') {
        throw new Error('회원가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.');
      }

      if (data.status === 'rejected') {
        throw new Error('회원가입이 거부되었습니다.');
      }

      const user = {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role || data.account_type,
        accountType: data.account_type,
        studentId: data.student_id,
        department: data.department,
        field: data.field,
        email: data.email,
        phone: data.phone
      };

      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('✅ 로그인 성공:', user);
      return user;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  // 학생 추가/수정
  const addOrUpdateStudent = async (studentData, existingStudent = null) => {
    try {
      if (existingStudent) {
        const { error } = await supabase
          .from('users')
          .update({
            name: studentData.name,
            department: studentData.department,
            field: studentData.field,
            email: studentData.email || null,
            phone: studentData.phone || null,
            memo: studentData.memo || null
          })
          .eq('id', existingStudent.id);

        if (error) throw error;
      } else {
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', studentData.studentId)
          .single();

        if (existingUser) {
          throw new Error('이미 존재하는 학번입니다.');
        }

        const { error } = await supabase
          .from('users')
          .insert([{
            username: studentData.studentId,
            student_id: studentData.studentId,
            password: studentData.password,
            name: studentData.name,
            department: studentData.department,
            field: studentData.field,
            email: studentData.email || null,
            phone: studentData.phone || null,
            account_type: 'student',
            role: 'student',
            status: 'approved',
            memo: studentData.memo || null,
            non_curricular_score: 0,
            core_subject_score: 0,
            industry_score: 0
          }]);

        if (error) throw error;
      }

      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('학생 추가/수정 실패:', error);
      throw error;
    }
  };

  // 학생 삭제
  const deleteStudent = async (studentId) => {
    try {
      console.log('=== 학생 삭제 시작 ===');
      console.log('삭제할 학생 ID:', studentId);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', studentId);

      if (error) {
        console.error('삭제 실패:', error);
        throw error;
      }

      console.log('✅ 학생 삭제 완료');
      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('학생 삭제 실패:', error);
      throw error;
    }
  };

  // 학생 정보 업데이트
  const updateStudentInfo = async (studentId, updatedData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', studentId);

      if (error) throw error;

      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('학생 정보 업데이트 실패:', error);
      throw error;
    }
  };

  // 학생 점수 업데이트
  const updateStudentScoresInSupabase = async (studentId, updatedStudent) => {
    try {
      console.log('=== 점수 업데이트 시작 ===');
      console.log('학생 ID:', studentId);
      console.log('업데이트할 데이터:', {
        non_curricular_score: updatedStudent.nonCurricularScore,
        core_subject_score: updatedStudent.coreSubjectScore,
        industry_score: updatedStudent.industryScore,
        non_curricular_history: updatedStudent.nonCurricularHistory,
        core_subject_history: updatedStudent.coreSubjectHistory,
        industry_history: updatedStudent.industryHistory
      });

      const { data, error } = await supabase
        .from('users')
        .update({
          non_curricular_score: updatedStudent.nonCurricularScore || 0,
          core_subject_score: updatedStudent.coreSubjectScore || 0,
          industry_score: updatedStudent.industryScore || 0,
          non_curricular_history: updatedStudent.nonCurricularHistory || [],
          core_subject_history: updatedStudent.coreSubjectHistory || [],
          industry_history: updatedStudent.industryHistory || []
        })
        .eq('id', studentId)
        .select();

      if (error) {
        console.error('❌ 점수 업데이트 실패:', error);
        throw error;
      }

      console.log('✅ 점수 업데이트 완료:', data);
      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('점수 업데이트 실패:', error);
      throw error;
    }
  };

  // 프로그램 추가/수정
  const addOrUpdateProgram = async (programData, existingProgram = null) => {
    try {
      console.log('프로그램 저장 - attachedFiles:', programData.attachedFiles);
      
      const dbData = {
        title: programData.title,
        category: programData.category,
        field: programData.field,
        start_date: programData.startDate || null,
        end_date: programData.endDate || null,
        status: programData.status,
        max_participants: programData.maxParticipants,
        requires_file: programData.requiresFile,
        score: programData.score,
        description: programData.description || null,
        image_url: programData.imageUrl || null,
        attached_files: JSON.parse(JSON.stringify(programData.attachedFiles || []))
      };
      
      console.log('Supabase 저장 데이터:', dbData);

      if (existingProgram) {
        const { error } = await supabase
          .from('programs')
          .update(dbData)
          .eq('id', existingProgram.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('programs')
          .insert([dbData]);

        if (error) throw error;
      }

      await loadProgramsFromSupabase();
    } catch (error) {
      console.error('프로그램 추가/수정 실패:', error);
      throw error;
    }
  };

  // 프로그램 삭제
  const deleteProgram = async (programId) => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      await loadProgramsFromSupabase();
    } catch (error) {
      console.error('프로그램 삭제 실패:', error);
      throw error;
    }
  };

  // 공지사항 추가/수정
  const addOrUpdateNotice = async (noticeData, existingNotice = null) => {
    try {
      const dbData = {
        title: noticeData.title,
        field: noticeData.field,
        content: noticeData.content,
        author: noticeData.author,
        date: noticeData.date,
        views: noticeData.views || 0,
        image_url: noticeData.imageUrl || null,
        attached_files: noticeData.attachedFiles || []
      };

      if (existingNotice) {
        const { error } = await supabase
          .from('notices')
          .update(dbData)
          .eq('id', existingNotice.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notices')
          .insert([dbData]);

        if (error) throw error;
      }

      await loadNoticesFromSupabase();
    } catch (error) {
      console.error('공지사항 추가/수정 실패:', error);
      throw error;
    }
  };

  // 공지사항 삭제
  const deleteNotice = async (noticeId) => {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;

      await loadNoticesFromSupabase();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      throw error;
    }
  };

  // 프로그램 신청
  const applyForProgram = async (programId, attachedFiles = []) => {
    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const { data: existingApplication } = await supabase
        .from('program_applications')
        .select('*')
        .eq('program_id', programId)
        .eq('student_id', currentUser.id)
        .single();

      if (existingApplication) {
        throw new Error('이미 신청한 프로그램입니다.');
      }

      console.log('신청 시 첨부파일:', attachedFiles);

      const { error } = await supabase
        .from('program_applications')
        .insert([{
          program_id: programId,
          student_id: currentUser.id,
          status: 'pending',
          attached_files: JSON.parse(JSON.stringify(attachedFiles))
        }]);

      if (error) throw error;

      await loadProgramApplicationsFromSupabase();
    } catch (error) {
      console.error('프로그램 신청 실패:', error);
      throw error;
    }
  };

  // 프로그램 신청 승인
  const approveApplication = async (applicationId) => {
    try {
      const { error } = await supabase
        .from('program_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (error) throw error;

      await loadProgramApplicationsFromSupabase();
    } catch (error) {
      console.error('신청 승인 실패:', error);
      throw error;
    }
  };

  // 프로그램 신청 거부
  const rejectApplication = async (applicationId) => {
    try {
      const { error } = await supabase
        .from('program_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;

      await loadProgramApplicationsFromSupabase();
    } catch (error) {
      console.error('신청 거부 실패:', error);
      throw error;
    }
  };

  // 프로그램 완료 처리
  const completeProgram = async (applicationId) => {
    try {
      const application = programApplications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('신청 내역을 찾을 수 없습니다.');
      }

      const program = programs.find(p => p.id === application.programId);
      if (!program) {
        throw new Error('프로그램을 찾을 수 없습니다.');
      }

      const student = students.find(s => s.id === application.studentId);
      if (!student) {
        throw new Error('학생을 찾을 수 없습니다.');
      }

      const { error: appError } = await supabase
        .from('program_applications')
        .update({
          status: 'completed'
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      let scoreField, historyField;
      if (program.category === '비교과') {
        scoreField = 'non_curricular_score';
        historyField = 'non_curricular_history';
      } else if (program.category === '교과') {
        scoreField = 'core_subject_score';
        historyField = 'core_subject_history';
      } else {
        scoreField = 'industry_score';
        historyField = 'industry_history';
      }

      const newScore = (student[scoreField.replace('_score', 'Score')] || 0) + program.score;
      const history = student[historyField.replace('_history', 'History')] || [];
      const newHistory = [...history, {
        programId: program.id,
        programTitle: program.title,
        score: program.score,
        date: new Date().toISOString().split('T')[0]
      }];

      const { error: scoreError } = await supabase
        .from('users')
        .update({
          [scoreField]: newScore,
          [historyField]: newHistory
        })
        .eq('id', student.id);

      if (scoreError) throw scoreError;

      await loadProgramApplicationsFromSupabase();
      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('프로그램 완료 처리 실패:', error);
      throw error;
    }
  };

  // 🔥 사용자 승인
  const approveUser = async (userId) => {
    try {
      console.log('=== 사용자 승인 시작 ===');
      console.log('사용자 ID:', userId);

      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ 사용자 승인 완료');
      await loadPendingUsersFromSupabase();
      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('사용자 승인 실패:', error);
      throw error;
    }
  };

  // 🔥 사용자 거부
  const rejectUser = async (userId) => {
    try {
      console.log('=== 사용자 거부 시작 ===');
      console.log('사용자 ID:', userId);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ 사용자 거부 완료 (삭제됨)');
      await loadPendingUsersFromSupabase();
    } catch (error) {
      console.error('사용자 거부 실패:', error);
      throw error;
    }
  };

  // ==========================================
  // 핵심 교과목 관련 함수들
  // ==========================================

  // Supabase에서 핵심 교과목 로드
  const loadCoreCoursesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('core_courses')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const formattedCourses = data.map(course => ({
        id: course.id,
        field: course.field,
        department: course.department,
        courseName: course.course_name,
        courseCode: course.course_code,
        credits: course.credits,
        courseType: course.course_type,
        orderIndex: course.order_index,
        isActive: course.is_active,
        createdAt: course.created_at,
        updatedBy: course.updated_by
      }));

      setCoreCourses(formattedCourses);
    } catch (error) {
      console.error('핵심 교과목 로드 실패:', error);
    }
  };

  // Supabase에서 학생 제출 데이터 로드
  const loadCoreCoursesSubmissionsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('core_courses_submissions')
        .select('*');

      if (error) throw error;

      const formattedSubmissions = data.map(sub => ({
        id: sub.id,
        studentId: sub.student_id,
        field: sub.field,
        department: sub.department,
        completedCourses: sub.completed_courses || [],
        totalCompletedCount: sub.total_completed_count,
        totalScore: sub.total_score,
        transcriptFile: sub.transcript_file,
        transcriptFileName: sub.transcript_file_name,
        transcriptFileSize: sub.transcript_file_size,
        status: sub.status,
        rejectionReason: sub.rejection_reason,
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at,
        reviewedBy: sub.reviewed_by,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      }));

      setCoreCoursesSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('교과목 제출 데이터 로드 실패:', error);
    }
  };

  // 교과목 추가
  const addCoreCourse = async (courseData) => {
    try {
      const { data, error } = await supabase
        .from('core_courses')
        .insert([{
          field: courseData.field,
          department: courseData.department,
          course_name: courseData.courseName,
          course_code: courseData.courseCode,
          credits: courseData.credits,
          course_type: courseData.courseType,
          order_index: courseData.orderIndex || 0,
          updated_by: currentUser?.username || 'admin'
        }])
        .select();

      if (error) throw error;

      console.log('✅ 교과목 추가 완료');
      await loadCoreCoursesFromSupabase();
      return { success: true };
    } catch (error) {
      console.error('교과목 추가 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 교과목 수정
  const updateCoreCourse = async (courseId, courseData) => {
    try {
      const { error } = await supabase
        .from('core_courses')
        .update({
          course_name: courseData.courseName,
          course_code: courseData.courseCode,
          credits: courseData.credits,
          course_type: courseData.courseType,
          order_index: courseData.orderIndex,
          updated_by: currentUser?.username || 'admin'
        })
        .eq('id', courseId);

      if (error) throw error;

      console.log('✅ 교과목 수정 완료');
      await loadCoreCoursesFromSupabase();
      return { success: true };
    } catch (error) {
      console.error('교과목 수정 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 교과목 삭제
  const deleteCoreCourse = async (courseId) => {
    try {
      const { error } = await supabase
        .from('core_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      console.log('✅ 교과목 삭제 완료');
      await loadCoreCoursesFromSupabase();
      return { success: true };
    } catch (error) {
      console.error('교과목 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 학생 교과목 제출
  const submitCoreCourses = async (submissionData) => {
    try {
      console.log('=== 핵심교과목 제출 시작 ===');
      console.log('제출 데이터:', submissionData);
      console.log('학생 ID:', submissionData.studentId);
      
      const student = students.find(s => s.id === submissionData.studentId);
      console.log('학생 정보:', student);
      
      if (!student) {
        throw new Error('학생 정보를 찾을 수 없습니다.');
      }
      
      // 기존 제출이 있는지 확인
      console.log('기존 제출 확인 중...');
      const { data: existing, error: checkError } = await supabase
        .from('core_courses_submissions')
        .select('id, status')
        .eq('student_id', submissionData.studentId)
        .maybeSingle();

      console.log('기존 제출:', existing);
      console.log('조회 에러:', checkError);

      let result;
      if (existing) {
        // 업데이트
        console.log('기존 제출 업데이트 중...');
        result = await supabase
          .from('core_courses_submissions')
          .update({
            field: student.field,
            department: student.department,
            completed_courses: submissionData.completedCourses,
            total_completed_count: submissionData.totalCompletedCount,
            total_score: submissionData.totalScore,
            transcript_file: submissionData.transcriptFile,
            transcript_file_name: submissionData.transcriptFileName,
            transcript_file_size: submissionData.transcriptFileSize,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('student_id', submissionData.studentId);
      } else {
        // 신규 삽입
        console.log('신규 제출 생성 중...');
        result = await supabase
          .from('core_courses_submissions')
          .insert([{
            student_id: submissionData.studentId,
            field: student.field,
            department: student.department,
            completed_courses: submissionData.completedCourses,
            total_completed_count: submissionData.totalCompletedCount,
            total_score: submissionData.totalScore,
            transcript_file: submissionData.transcriptFile,
            transcript_file_name: submissionData.transcriptFileName,
            transcript_file_size: submissionData.transcriptFileSize,
            status: 'pending',
            submitted_at: new Date().toISOString()
          }]);
      }

      console.log('Supabase 결과:', result);

      if (result.error) {
        console.error('❌ Supabase 에러:', result.error);
        throw result.error;
      }

      console.log('✅ 교과목 제출 완료');
      await loadCoreCoursesSubmissionsFromSupabase();
      return { success: true };
    } catch (error) {
      console.error('❌ 교과목 제출 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 제출 승인 (완전 개선 버전)
  const approveCoreCourses = async (submissionId) => {
    console.log('=== 핵심교과목 승인 시작 ===');
    console.log('제출 ID:', submissionId);

    try {
      // 1. 제출 데이터 가져오기
      const submission = coreCoursesSubmissions.find(s => s.id === submissionId);
      if (!submission) {
        throw new Error('제출 데이터를 찾을 수 없습니다.');
      }

      console.log('📋 제출 정보:', {
        submissionId: submission.id,
        studentId: submission.studentId,
        totalScore: submission.totalScore,
        status: submission.status
      });

      // 2. 학생 정보 확인
      const student = students.find(s => s.id === submission.studentId);
      if (!student) {
        throw new Error('학생 정보를 찾을 수 없습니다.');
      }

      console.log('👨‍🎓 학생 정보:', {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        currentCoreScore: student.coreSubjectScore
      });

      // 3. users 테이블 업데이트 (점수 반영)
      console.log('📝 users 테이블 업데이트 중...');
      const { data: updatedUser, error: userError } = await supabase
        .from('users')
        .update({
          core_courses_score: submission.totalScore,
          core_subject_score: submission.totalScore  // 둘 다 업데이트
        })
        .eq('id', submission.studentId)
        .select();  // 결과 확인을 위해 select 추가

      if (userError) {
        console.error('❌ users 테이블 업데이트 실패:', userError);
        throw new Error(`학생 점수 업데이트 실패: ${userError.message}`);
      }

      console.log('✅ users 테이블 업데이트 성공:', updatedUser);

      // 4. 제출 상태 업데이트 (승인 처리)
      console.log('📝 제출 상태 업데이트 중...');
      const { data: updatedSubmission, error: submissionError } = await supabase
        .from('core_courses_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser?.id || null
        })
        .eq('id', submissionId)
        .select();

      if (submissionError) {
        console.error('❌ 제출 상태 업데이트 실패:', submissionError);
        
        // 롤백: users 테이블 원상복구
        console.log('⏪ users 테이블 롤백 중...');
        await supabase
          .from('users')
          .update({
            core_courses_score: student.coreSubjectScore || 0,
            core_subject_score: student.coreSubjectScore || 0
          })
          .eq('id', submission.studentId);
        
        throw new Error(`제출 상태 업데이트 실패: ${submissionError.message}`);
      }

      console.log('✅ 제출 상태 업데이트 성공:', updatedSubmission);

      // 5. 데이터 리로드
      console.log('🔄 데이터 리로드 중...');
      await Promise.all([
        loadCoreCoursesSubmissionsFromSupabase(),
        loadStudentsFromSupabase()
      ]);

      console.log('✅ 핵심교과목 승인 완료!');
      console.log(`   - 학생: ${student.name} (${student.studentId})`);
      console.log(`   - 점수: ${submission.totalScore}점`);
      console.log('=== 승인 프로세스 종료 ===');

      return { 
        success: true,
        message: `${student.name} 학생의 핵심교과목 ${submission.totalScore}점이 승인되었습니다.`
      };

    } catch (error) {
      console.error('=== 승인 실패 ===');
      console.error('❌ 에러:', error);
      console.error('❌ 상세:', error.message);
      console.error('❌ Stack:', error.stack);
      
      return { 
        success: false, 
        error: error.message || '승인 처리 중 오류가 발생했습니다.'
      };
    }
  };

  // 제출 반려 (개선 버전)
  const rejectCoreCourses = async (submissionId, reason) => {
    console.log('=== 핵심교과목 반려 시작 ===');
    console.log('제출 ID:', submissionId);
    console.log('반려 사유:', reason);

    try {
      // 1. 제출 데이터 확인
      const submission = coreCoursesSubmissions.find(s => s.id === submissionId);
      if (!submission) {
        throw new Error('제출 데이터를 찾을 수 없습니다.');
      }

      // 2. 학생 정보 확인
      const student = students.find(s => s.id === submission.studentId);
      console.log('👨‍🎓 학생:', student?.name, student?.studentId);

      // 3. 제출 상태 업데이트
      console.log('📝 반려 처리 중...');
      const { data, error } = await supabase
        .from('core_courses_submissions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser?.id || null
        })
        .eq('id', submissionId)
        .select();

      if (error) {
        console.error('❌ 반려 처리 실패:', error);
        throw new Error(`반려 처리 실패: ${error.message}`);
      }

      console.log('✅ 반려 처리 성공:', data);

      // 4. 데이터 리로드
      await loadCoreCoursesSubmissionsFromSupabase();

      console.log('✅ 핵심교과목 반려 완료!');
      console.log('=== 반려 프로세스 종료 ===');

      return { 
        success: true,
        message: `${student?.name} 학생의 제출이 반려되었습니다.`
      };

    } catch (error) {
      console.error('=== 반려 실패 ===');
      console.error('❌ 에러:', error);
      return { 
        success: false, 
        error: error.message || '반려 처리 중 오류가 발생했습니다.'
      };
    }
  };

  // 학과별 교과목 조회
  const getCoreCoursesByDepartment = (field, department) => {
    return coreCourses.filter(
      c => c.field === field && c.department === department
    );
  };

  // 학생의 제출 데이터 조회
  const getStudentSubmission = (studentId) => {
    return coreCoursesSubmissions.find(s => s.studentId === studentId);
  };

  // ==========================================
  // 끝: 핵심 교과목 관련 함수들
  // ==========================================

  // 초기 데이터 로드
  useEffect(() => {
    if (currentUser) {
      loadStudentsFromSupabase();
      loadProgramsFromSupabase();
      loadNoticesFromSupabase();
      loadProgramApplicationsFromSupabase();
      loadCoreCoursesFromSupabase();
      loadCoreCoursesSubmissionsFromSupabase();

      // 🔥 마스터 권한일 때만 pending 사용자 로드
      if (currentUser.role === 'master') {
        loadPendingUsersFromSupabase();
      }
    }
  }, [currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      students,
      programs,
      notices,
      programApplications,
      pendingUsers,
      coreCourses,
      coreCoursesSubmissions,
      login,
      addOrUpdateStudent,
      deleteStudent,
      updateStudentInfo,
      updateStudentScoresInSupabase,
      addOrUpdateProgram,
      deleteProgram,
      addOrUpdateNotice,
      deleteNotice,
      applyForProgram,
      approveApplication,
      rejectApplication,
      completeProgram,
      approveUser,
      rejectUser,
      addCoreCourse,
      updateCoreCourse,
      deleteCoreCourse,
      submitCoreCourses,
      approveCoreCourses,
      rejectCoreCourses,
      getCoreCoursesByDepartment,
      getStudentSubmission
    }}>
      {children}
    </AppContext.Provider>
  );
};