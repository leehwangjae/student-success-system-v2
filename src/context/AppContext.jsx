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

  // Supabase에서 학생 데이터 로드
  const loadStudentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('account_type', 'student')
        .eq('status', 'approved');

      if (error) throw error;

      const formattedStudents = data.map(user => ({
        id: user.id,
        studentId: user.student_id || user.username,
        name: user.name,
        department: user.department,
        field: user.field || '바이오',
        email: user.email,
        phone: user.phone,
        password: user.password,
        role: 'student',
        memo: user.memo || '',
        nonCurricularScore: user.non_curricular_score || 0,
        coreSubjectScore: user.core_subject_score || 0,
        industryScore: user.industry_score || 0,
        total: (user.non_curricular_score || 0) + (user.core_subject_score || 0) + (user.industry_score || 0),
        nonCurricularHistory: user.non_curricular_history || [],
        coreSubjectHistory: user.core_subject_history || [],
        industryHistory: user.industry_history || []
      }));

      console.log('✅ 학생 데이터 로드 완료:', formattedStudents.length);
      setStudents(formattedStudents);
    } catch (error) {
      console.error('학생 데이터 로드 실패:', error);
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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedApplications = data.map(app => ({
        id: app.id,
        programId: app.program_id,
        studentId: app.student_id,
        status: app.status,
        appliedDate: app.applied_date,
        completedDate: app.completed_date
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
        attached_files: programData.attachedFiles || []
      };

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
  const applyForProgram = async (programId) => {
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

      const { error } = await supabase
        .from('program_applications')
        .insert([{
          program_id: programId,
          student_id: currentUser.id,
          status: 'pending',
          applied_date: new Date().toISOString().split('T')[0]
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
          status: 'completed',
          completed_date: new Date().toISOString().split('T')[0]
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

  // 초기 데이터 로드
  useEffect(() => {
    if (currentUser) {
      loadStudentsFromSupabase();
      loadProgramsFromSupabase();
      loadNoticesFromSupabase();
      loadProgramApplicationsFromSupabase();

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
      rejectUser
    }}>
      {children}
    </AppContext.Provider>
  );
};