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
  const [nonCurricularPrograms, setNonCurricularPrograms] = useState([]);
  const [nonCurricularSubmissions, setNonCurricularSubmissions] = useState([]);

  // Supabase에서 학생 데이터 로드
  const loadStudentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('users_2025_11_27_07_17')
        .select('id, student_id, username, name, department, field, grade, email, phone, role, memo, status, account_type, ssn, bank_name, account_number, account_holder, privacy_consented, privacy_consented_at, non_curricular_score, core_subject_score, core_courses_score, industry_score, created_at')
        .eq('account_type', 'student')
        .eq('status', 'approved');

      if (error) throw error;

      const formattedStudents = data.map(user => ({
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
        ssn: user.ssn || '',
        bankName: user.bank_name || '',
        accountNumber: user.account_number || '',
        accountHolder: user.account_holder || '',
        privacy_consented: user.privacy_consented || false,
        privacy_consented_at: user.privacy_consented_at || null,
        nonCurricularScore: user.non_curricular_score || 0,
        coreSubjectScore: user.core_subject_score || user.core_courses_score || 0,
        coreCoursesScore: user.core_courses_score || 0,
        industryScore: user.industry_score || 0,
        total: (user.non_curricular_score || 0) +
               (user.core_subject_score || user.core_courses_score || 0) +
               (user.industry_score || 0),
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error('❌ 학생 데이터 로드 실패:', error);
    }
  };

  // Supabase에서 프로그램 데이터 로드
  const loadProgramsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('programs_2025_11_27_07_17')
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

      setPrograms(formattedPrograms);
    } catch (error) {
      console.error('프로그램 데이터 로드 실패:', error);
    }
  };

  // Supabase에서 공지사항 데이터 로드
  const loadNoticesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('notices_2025_11_27_07_17')
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
        attachedFiles: notice.attached_files || [],
        isPopup: notice.is_popup || false
      }));

      setNotices(formattedNotices);
    } catch (error) {
      console.error('공지사항 데이터 로드 실패:', error);
    }
  };

  // Supabase에서 프로그램 신청 데이터 로드
  const loadProgramApplicationsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('program_applications_2025_11_27_07_17')
        .select('id, program_id, student_id, status, created_at, attached_files')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedApplications = data.map(app => ({
        id: app.id,
        programId: app.program_id,
        studentId: app.student_id,
        status: app.status,
        appliedDate: app.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        completedDate: null,
        attachedFiles: app.attached_files || []
      }));

      setProgramApplications(formattedApplications);
    } catch (error) {
      console.error('프로그램 신청 데이터 로드 실패:', error);
    }
  };

  // pending 상태 사용자 로드
  const loadPendingUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('users_2025_11_27_07_17')
        .select('id, student_id, username, name, department, field, grade, email, phone, account_type, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Pending 사용자 로드 실패:', error);
    }
  };

  // 로그인
  const login = async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('users_2025_11_27_07_17')
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
        phone: data.phone,
        // 민감정보
        ssn: data.ssn || '',
        bankName: data.bank_name || '',
        accountNumber: data.account_number || '',
        accountHolder: data.account_holder || ''
      };

      console.log('🔍 DB에서 가져온 데이터:', {
        role: data.role,
        account_type: data.account_type,
        status: data.status
      });
      console.log('✅ 로그인 성공');

      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
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
          .from('users_2025_11_27_07_17')
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
          .from('users_2025_11_27_07_17')
          .select('username')
          .eq('username', studentData.studentId)
          .single();

        if (existingUser) {
          throw new Error('이미 존재하는 학번입니다.');
        }

        const { error } = await supabase
          .from('users_2025_11_27_07_17')
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
      const { error } = await supabase
        .from('users_2025_11_27_07_17')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('학생 삭제 실패:', error);
      throw error;
    }
  };

  // 학생 정보 업데이트
  const updateStudentInfo = async (studentId, updatedData) => {
    try {
      // camelCase를 snake_case로 변환
      const dbData = {
        email: updatedData.email,
        phone: updatedData.phone,
        ssn: updatedData.ssn,
        bank_name: updatedData.bankName,
        account_number: updatedData.accountNumber,
        account_holder: updatedData.accountHolder
      };

      const { error } = await supabase
        .from('users_2025_11_27_07_17')
        .update(dbData)
        .eq('id', studentId);

      if (error) throw error;

      await loadStudentsFromSupabase();
      return true;
    } catch (error) {
      console.error('학생 정보 업데이트 실패:', error);
      throw error;
    }
  };

  // 학생 점수 업데이트
  const updateStudentScoresInSupabase = async (studentId, updatedStudent) => {
    try {
      const { data, error } = await supabase
        .from('users_2025_11_27_07_17')
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

      if (error) throw error;

      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('점수 업데이트 실패:', error);
      throw error;
    }
  };

  // 프로그램 추가/수정
  const addOrUpdateProgram = async (programData, existingProgram = null) => {
    try {
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

      if (existingProgram) {
        const { error } = await supabase
          .from('programs_2025_11_27_07_17')
          .update(dbData)
          .eq('id', existingProgram.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('programs_2025_11_27_07_17')
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
        .from('programs_2025_11_27_07_17')
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
        attached_files: noticeData.attachedFiles || [],
        is_popup: noticeData.isPopup || false
      };

      if (existingNotice) {
        const { error } = await supabase
          .from('notices_2025_11_27_07_17')
          .update(dbData)
          .eq('id', existingNotice.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notices_2025_11_27_07_17')
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
        .from('notices_2025_11_27_07_17')
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
        .from('program_applications_2025_11_27_07_17')
        .select('*')
        .eq('program_id', programId)
        .eq('student_id', currentUser.id)
        .single();

      if (existingApplication) {
        throw new Error('이미 신청한 프로그램입니다.');
      }

      const { error } = await supabase
        .from('program_applications_2025_11_27_07_17')
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
        .from('program_applications_2025_11_27_07_17')
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
        .from('program_applications_2025_11_27_07_17')
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
      if (!application) throw new Error('신청 내역을 찾을 수 없습니다.');

      const program = programs.find(p => p.id === application.programId);
      if (!program) throw new Error('프로그램을 찾을 수 없습니다.');

      const student = students.find(s => s.id === application.studentId);
      if (!student) throw new Error('학생을 찾을 수 없습니다.');

      const { error: appError } = await supabase
        .from('program_applications_2025_11_27_07_17')
        .update({ status: 'completed' })
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

      // 고유 ID 생성 (타임스탬프 + 랜덤)
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newHistory = [...history, {
        id: uniqueId,
        program: program.title,  // StudentDetailModal에서 activity.program 사용
        score: program.score,
        date: new Date().toISOString().split('T')[0]
      }];

      const { error: scoreError } = await supabase
        .from('users_2025_11_27_07_17')
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

  // 사용자 승인
  const approveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users_2025_11_27_07_17')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      await loadPendingUsersFromSupabase();
      await loadStudentsFromSupabase();
    } catch (error) {
      console.error('사용자 승인 실패:', error);
      throw error;
    }
  };

  // 사용자 거부
  const rejectUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users_2025_11_27_07_17')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await loadPendingUsersFromSupabase();
    } catch (error) {
      console.error('사용자 거부 실패:', error);
      throw error;
    }
  };

  // 핵심 교과목 관련 함수들
  const loadCoreCoursesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('core_courses_2025_11_27_07_17')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('핵심 교과목 Supabase 조회 오류:', error);
        setCoreCourses([]);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('핵심 교과목 데이터가 없습니다.');
        setCoreCourses([]);
        return;
      }

      const formattedCourses = data.map(course => ({
        id: course.id,
        field: course.field || '미지정',
        department: course.target_departments?.[0] || '미지정',
        courseName: course.name,
        courseCode: course.course_code,
        credits: course.credits,
        courseType: course.category,
        semester: course.semester,
        targetDepartments: course.target_departments,
        targetGrades: course.target_grades,
        createdAt: course.created_at
      }));

      setCoreCourses(formattedCourses);
    } catch (error) {
      console.error('핵심 교과목 로드 실패:', error);
      setCoreCourses([]);
    }
  };

  const loadCoreCoursesSubmissionsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('core_courses_submissions_2025_11_27_07_17')
        .select('id, student_id, field, department, completed_courses, total_completed_count, total_score, payment_info, grade_at_2025_fall, status, rejection_reason, submitted_at, reviewed_at, reviewed_by, created_at, updated_at');

      if (error) {
        // 테이블이 없거나 권한이 없는 경우 조용히 빈 배열 설정
        // console.error('교과목 제출 Supabase 조회 오류:', error);
        setCoreCoursesSubmissions([]);
        return;
      }

      if (!data || data.length === 0) {
        // 데이터가 없는 경우 조용히 빈 배열 설정
        // console.warn('교과목 제출 데이터가 없습니다.');
        setCoreCoursesSubmissions([]);
        return;
      }

      const formattedSubmissions = data.map(sub => ({
        id: sub.id,
        studentId: sub.student_id,
        field: sub.field,
        department: sub.department,
        completedCourses: sub.completed_courses || [],
        totalCompletedCount: sub.total_completed_count,
        totalScore: sub.total_score,
        uploadedFiles: sub.uploaded_files || [],
        paymentInfo: sub.payment_info || null,
        gradeAt2025Fall: sub.grade_at_2025_fall || '2학년',
        // 이전 필드 호환성 유지
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
      // 예외 발생 시 조용히 처리
      // console.error('교과목 제출 데이터 로드 실패:', error);
      setCoreCoursesSubmissions([]);
    }
  };

  // 비교과 프로그램 로드
  const loadNonCurricularProgramsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('non_curricular_programs_2025_11_27_07_17')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setNonCurricularPrograms([]);
        return;
      }

      const formattedPrograms = (data || []).map(program => ({
        id: program.id,
        program_name: program.program_name,
        programName: program.program_name,
        category: program.category,
        field: program.field,
        department: program.department,
        score: program.score,
        description: program.description,
        createdAt: program.created_at,
        updatedAt: program.updated_at
      }));

      setNonCurricularPrograms(formattedPrograms);
    } catch (error) {
      setNonCurricularPrograms([]);
    }
  };

  // 비교과 프로그램 제출 내역 로드
  const loadNonCurricularSubmissionsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('non_curricular_submissions_2025_11_27_07_17')
        .select('id, student_id, completed_programs, certificate_files, total_program_count, total_score, status, rejection_reason, submitted_at, reviewed_at, created_at, updated_at');

      if (error) {
        setNonCurricularSubmissions([]);
        return;
      }

      const formattedSubmissions = (data || []).map(sub => ({
        id: sub.id,
        studentId: sub.student_id,
        completedPrograms: sub.completed_programs || [],
        certificateFiles: sub.certificate_files || [],
        totalProgramCount: sub.total_program_count || 0,
        totalScore: sub.total_score || 0,
        status: sub.status,
        rejectionReason: sub.rejection_reason,
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      }));

      setNonCurricularSubmissions(formattedSubmissions);
    } catch (error) {
      setNonCurricularSubmissions([]);
    }
  };

  const addCoreCourse = async (courseData) => {
    try {
      const { error } = await supabase
        .from('core_courses_2025_11_27_07_17')
        .insert([{
          name: courseData.courseName,
          course_code: courseData.courseCode,
          credits: courseData.credits,
          category: courseData.courseType,
          target_departments: courseData.department ? [courseData.department] : [],
          target_grades: [],
          semester: '1학기' // NOT NULL 제약 때문에 기본값 필요
        }]);

      if (error) throw error;

      await loadCoreCoursesFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateCoreCourse = async (courseId, courseData) => {
    try {
      const { error } = await supabase
        .from('core_courses_2025_11_27_07_17')
        .update({
          name: courseData.courseName,
          course_code: courseData.courseCode,
          credits: courseData.credits,
          category: courseData.courseType,
          target_departments: courseData.department ? [courseData.department] : [],
          target_grades: [],
          semester: '1학기'
        })
        .eq('id', courseId);

      if (error) throw error;

      await loadCoreCoursesFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteCoreCourse = async (courseId) => {
    try {
      const { error } = await supabase
        .from('core_courses_2025_11_27_07_17')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      await loadCoreCoursesFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const submitCoreCourses = async (submissionData) => {
    try {
      const student = students.find(s => s.id === submissionData.studentId);
      if (!student) throw new Error('학생 정보를 찾을 수 없습니다.');

      const { data: existing } = await supabase
        .from('core_courses_submissions_2025_11_27_07_17')
        .select('id')
        .eq('student_id', submissionData.studentId)
        .maybeSingle();

      const submissionPayload = {
        field: student.field,
        department: student.department,
        completed_courses: submissionData.completedCourses,
        total_completed_count: submissionData.totalCompletedCount,
        total_score: submissionData.totalScore,
        uploaded_files: submissionData.uploadedFiles || [],
        payment_info: submissionData.paymentInfo || null,
        grade_at_2025_fall: submissionData.gradeAt2025Fall || '2학년',
        status: 'pending',
        updated_at: new Date().toISOString()
      };

      let result;
      if (existing) {
        submissionPayload.submitted_at = new Date().toISOString();

        result = await supabase
          .from('core_courses_submissions_2025_11_27_07_17')
          .update(submissionPayload)
          .eq('student_id', submissionData.studentId);
      } else {
        submissionPayload.student_id = submissionData.studentId;
        submissionPayload.submitted_at = new Date().toISOString();

        result = await supabase
          .from('core_courses_submissions_2025_11_27_07_17')
          .insert([submissionPayload]);
      }

      if (result.error) {
        console.error('❌ Supabase 저장 오류:', result.error);
        throw result.error;
      }

      // 지급 정보가 있으면 users 테이블도 업데이트
      if (submissionData.paymentInfo && submissionData.paymentInfo.bankName &&
          submissionData.paymentInfo.accountNumber && submissionData.paymentInfo.accountHolder) {
        await supabase
          .from('users_2025_11_27_07_17')
          .update({
            bank_name: submissionData.paymentInfo.bankName,
            account_number: submissionData.paymentInfo.accountNumber,
            account_holder: submissionData.paymentInfo.accountHolder
          })
          .eq('id', submissionData.studentId);
      }
      await loadCoreCoursesSubmissionsFromSupabase();
      await loadStudentsFromSupabase(); // 학생 정보도 다시 로드
      return { success: true };
    } catch (error) {
      console.error('❌ submitCoreCourses 오류:', error);
      return { success: false, error: error.message };
    }
  };

  const approveCoreCourses = async (submissionId) => {
    try {
      const submission = coreCoursesSubmissions.find(s => s.id === submissionId);
      if (!submission) throw new Error('제출 데이터를 찾을 수 없습니다.');

      const student = students.find(s => s.id === submission.studentId);
      if (!student) throw new Error('학생 정보를 찾을 수 없습니다.');

      const { error: userError } = await supabase
        .from('users_2025_11_27_07_17')
        .update({
          core_subject_score: submission.totalScore
        })
        .eq('id', submission.studentId);

      if (userError) throw userError;

      const { error: submissionError } = await supabase
        .from('core_courses_submissions_2025_11_27_07_17')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      await Promise.all([
        loadCoreCoursesSubmissionsFromSupabase(),
        loadStudentsFromSupabase()
      ]);

      return { 
        success: true,
        message: `${student.name} 학생의 핵심교과목 ${submission.totalScore}점이 승인되었습니다.`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const rejectCoreCourses = async (submissionId, reason) => {
    try {
      const { error } = await supabase
        .from('core_courses_submissions_2025_11_27_07_17')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      await loadCoreCoursesSubmissionsFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getCoreCoursesByDepartment = (field, department) => {
    // target_departments 배열로 필터링
    return coreCourses.filter(c => {
      if (!c.targetDepartments || c.targetDepartments.length === 0) {
        return true; // 대상 학과가 없으면 모두 표시
      }
      return c.targetDepartments.includes(department);
    });
  };

  const getStudentSubmission = (studentId) => {
    return coreCoursesSubmissions.find(s => s.studentId === studentId);
  };

  // 비교과 프로그램 추가
  const addNonCurricularProgram = async (programData) => {
    try {
      const { error } = await supabase
        .from('non_curricular_programs_2025_11_27_07_17')
        .insert([{
          program_name: programData.programName,
          category: programData.category,
          field: programData.field,
          department: programData.department,
          score: programData.score,
          description: programData.description
        }]);

      if (error) throw error;
      await loadNonCurricularProgramsFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비교과 프로그램 수정
  const updateNonCurricularProgram = async (programId, programData) => {
    try {
      const { error} = await supabase
        .from('non_curricular_programs_2025_11_27_07_17')
        .update({
          program_name: programData.programName,
          category: programData.category,
          field: programData.field,
          department: programData.department,
          score: programData.score,
          description: programData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      if (error) throw error;
      await loadNonCurricularProgramsFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비교과 프로그램 삭제
  const deleteNonCurricularProgram = async (programId) => {
    try {
      const { error } = await supabase
        .from('non_curricular_programs_2025_11_27_07_17')
        .delete()
        .eq('id', programId);

      if (error) throw error;
      await loadNonCurricularProgramsFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비교과 프로그램 제출
  const submitNonCurricularPrograms = async (submissionData) => {
    try {
      // 기존 제출 확인
      const { data: existing } = await supabase
        .from('non_curricular_submissions_2025_11_27_07_17')
        .select('id')
        .eq('student_id', submissionData.studentId)
        .single();

      let error;

      if (existing) {
        // 기존 제출이 있으면 업데이트
        const result = await supabase
          .from('non_curricular_submissions_2025_11_27_07_17')
          .update({
            completed_programs: submissionData.completedPrograms,
            certificate_files: submissionData.certificateFiles,
            total_program_count: submissionData.totalProgramCount,
            total_score: submissionData.totalScore,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('student_id', submissionData.studentId);

        error = result.error;
      } else {
        // 새로운 제출
        const result = await supabase
          .from('non_curricular_submissions_2025_11_27_07_17')
          .insert([{
            student_id: submissionData.studentId,
            completed_programs: submissionData.completedPrograms,
            certificate_files: submissionData.certificateFiles,
            total_program_count: submissionData.totalProgramCount,
            total_score: submissionData.totalScore,
            status: 'pending',
            submitted_at: new Date().toISOString()
          }]);

        error = result.error;
      }

      if (error) throw error;
      await loadNonCurricularSubmissionsFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비교과 프로그램 승인
  const approveNonCurricularPrograms = async (submissionId) => {
    try {
      const submission = nonCurricularSubmissions.find(s => s.id === submissionId);
      if (!submission) throw new Error('제출 데이터를 찾을 수 없습니다.');

      // 학생 점수 업데이트
      const { error: userError } = await supabase
        .from('users_2025_11_27_07_17')
        .update({
          non_curricular_score: submission.totalScore
        })
        .eq('id', submission.studentId);

      if (userError) throw userError;

      // 제출 상태 업데이트
      const { error: submissionError } = await supabase
        .from('non_curricular_submissions_2025_11_27_07_17')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      await Promise.all([
        loadNonCurricularSubmissionsFromSupabase(),
        loadStudentsFromSupabase()
      ]);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 비교과 프로그램 반려
  const rejectNonCurricularPrograms = async (submissionId, reason) => {
    try {
      const { error } = await supabase
        .from('non_curricular_submissions_2025_11_27_07_17')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      await loadNonCurricularSubmissionsFromSupabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 학생별 비교과 프로그램 제출 내역 조회
  const getNonCurricularSubmission = (studentId) => {
    return nonCurricularSubmissions.find(s => s.studentId === studentId);
  };

  // 초기 데이터 로드 - 역할별 분리 + 순차 로드로 DB 부하 최소화
  useEffect(() => {
    if (!currentUser) return;

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'master' ||
                    currentUser.accountType === 'admin' || currentUser.accountType === 'master';

    const loadData = async () => {
      // 공통: 공지사항, 비교과/핵심교과 프로그램 목록은 모두 필요
      await loadNoticesFromSupabase();
      await loadCoreCoursesFromSupabase();
      await loadNonCurricularProgramsFromSupabase();

      if (isAdmin) {
        // 관리자: 전체 데이터 순차 로드
        await loadStudentsFromSupabase();
        await loadProgramsFromSupabase();
        await loadProgramApplicationsFromSupabase();
        await loadPendingUsersFromSupabase();
        await loadCoreCoursesSubmissionsFromSupabase();
        await loadNonCurricularSubmissionsFromSupabase();
      } else {
        // 학생: 본인 관련 데이터만 로드
        await loadCoreCoursesSubmissionsFromSupabase();
        await loadNonCurricularSubmissionsFromSupabase();
        await loadProgramApplicationsFromSupabase();
      }
    };

    loadData();
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
      getStudentSubmission,
      nonCurricularPrograms,
      nonCurricularSubmissions,
      addNonCurricularProgram,
      updateNonCurricularProgram,
      deleteNonCurricularProgram,
      submitNonCurricularPrograms,
      approveNonCurricularPrograms,
      rejectNonCurricularPrograms,
      getNonCurricularSubmission
    }}>
      {children}
    </AppContext.Provider>
  );
};