import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useModalStore } from '../hooks/useModal';
import StudentDetailModal from '../components/modals/StudentDetailModal';
import ProgramDetailModal from '../components/modals/ProgramDetailModal';
import NoticeDetailModal from '../components/modals/NoticeDetailModal';
import * as XLSX from 'xlsx';
import ProgramModal from '../components/modals/ProgramModal';
import NoticeModal from '../components/modals/NoticeModal';
import ApplicantsModal from '../components/modals/ApplicantsModal';
import CoreCoursesSettingPage from './admin/CoreCoursesSettingPage';
import CoreCoursesReviewPage from './admin/CoreCoursesReviewPage';

function AdminPage() {
  const {
    currentUser,
    setCurrentUser,
    students,
    programs,
    notices,
    programApplications,
    pendingUsers,
    addOrUpdateStudent,
    deleteStudent,
    updateStudentInfo,
    addOrUpdateProgram,
    deleteProgram,
    addOrUpdateNotice,
    deleteNotice,
    approveApplication,
    rejectApplication,
    completeProgram,
    approveUser,
    rejectUser
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('전체');
  const [showCompleted, setShowCompleted] = useState(false);

  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [showProgramDetailModal, setShowProgramDetailModal] = useState(false);
  const [showNoticeDetailModal, setShowNoticeDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // 신청자 모달
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedProgramForApplicants, setSelectedProgramForApplicants] = useState(null);

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [programModalData, setProgramModalData] = useState({
    title: '',
    category: '비교과',
    field: '바이오',
    startDate: '',
    endDate: '',
    status: '모집중',
    maxParticipants: 10,
    requiresFile: false,
    score: 10,
    description: '',
    imageUrl: '',
    attachedFiles: []
  });

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeModalData, setNoticeModalData] = useState({
    title: '',
    field: '전체',
    content: '',
    author: currentUser?.name || '관리자',
    date: new Date().toISOString().split('T')[0],
    views: 0,
    imageUrl: '',
    attachedFiles: []
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentModalData, setStudentModalData] = useState({
    studentId: '',
    name: '',
    department: '',
    field: '바이오',
    email: '',
    phone: '',
    password: '',
    memo: ''
  });

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const downloadStudentsExcel = () => {
    const excelData = filteredStudents.map(student => ({
      '학번': student.studentId,
      '이름': student.name,
      '학과': student.department,
      '분야': student.field,
      '이메일': student.email || '',
      '전화번호': student.phone || '',
      '비교과 점수': student.nonCurricularScore,
      '교과 점수': student.coreSubjectScore,
      '산학협력 점수': student.industryScore,
      '총점': student.total,
      '메모': student.memo || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '학생목록');

    const columnWidths = [
      { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 10 },
      { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 30 }
    ];
    worksheet['!cols'] = columnWidths;

    const fileName = `학생목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showAlert(`${filteredStudents.length}명의 학생 데이터를 다운로드했습니다.`);
  };

  const downloadProgramsExcel = () => {
    const getProgramApplicantCount = (programId) => {
      return programApplications.filter(
        app => app.programId === programId && 
               (app.status === 'pending' || app.status === 'approved' || app.status === 'completed')
      ).length;
    };

    const excelData = filteredPrograms.map(program => {
      const applicantCount = getProgramApplicantCount(program.id);
      const isFull = applicantCount >= program.maxParticipants;
      
      return {
        '프로그램명': program.title,
        '분류': program.category,
        '분야': program.field,
        '시작일': program.startDate || '',
        '종료일': program.endDate || '',
        '상태': program.status,
        '신청자': applicantCount,
        '정원': program.maxParticipants,
        '여석': program.maxParticipants - applicantCount,
        '마감여부': isFull ? '마감' : '모집중',
        '점수': program.score,
        '파일첨부필수': program.requiresFile ? 'O' : 'X',
        '설명': program.description || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '프로그램목록');

    worksheet['!cols'] = [
      { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 50 }
    ];

    const fileName = `프로그램목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showAlert(`${filteredPrograms.length}개의 프로그램 데이터를 다운로드했습니다.`);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesField = selectedField === '전체' || student.field === selectedField;
      return matchesSearch && matchesField;
    });
  }, [students, searchTerm, selectedField]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesField = selectedField === '전체' || program.field === selectedField;
      return matchesSearch && matchesField;
    });
  }, [programs, searchTerm, selectedField]);

  const filteredNotices = useMemo(() => {
    return notices.filter(notice => {
      const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesField = selectedField === '전체' || notice.field === selectedField;
      return matchesSearch && matchesField;
    });
  }, [notices, searchTerm, selectedField]);

  const applicationsWithDetails = useMemo(() => {
    return programApplications.map(app => ({
      ...app,
      program: programs.find(p => p.id === app.programId),
      student: students.find(s => s.id === app.studentId)
    })).filter(app => app.program && app.student);
  }, [programApplications, programs, students]);

  const handleAddProgram = () => {
    setEditingProgram(null);
    setProgramModalData({
      title: '',
      category: '비교과',
      field: '바이오',
      startDate: '',
      endDate: '',
      status: '모집중',
      maxParticipants: 10,
      requiresFile: false,
      score: 10,
      description: '',
      imageUrl: '',
      attachedFiles: []
    });
    setShowProgramModal(true);
  };

  const handleEditProgram = (program) => {
    console.log('📝 프로그램 수정 모드:', program);
    setEditingProgram(program);
    setShowProgramModal(true);
  };

  const handleSaveProgramModal = async () => {
    if (!programModalData.title || !programModalData.category || !programModalData.field) {
      showAlert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      const programData = {
        title: programModalData.title,
        category: programModalData.category,
        field: programModalData.field,
        startDate: programModalData.startDate || null,
        endDate: programModalData.endDate || null,
        status: programModalData.status,
        maxParticipants: parseInt(programModalData.maxParticipants) || 10,
        requiresFile: Boolean(programModalData.requiresFile),
        score: parseInt(programModalData.score) || 10,
        description: programModalData.description || '',
        imageUrl: programModalData.imageUrl || '',
        attachedFiles: programModalData.attachedFiles || []
      };

      await addOrUpdateProgram(programData, editingProgram);
      
      showAlert(editingProgram ? '프로그램이 수정되었습니다.' : '프로그램이 추가되었습니다.');
      setShowProgramModal(false);
      setEditingProgram(null);
      setProgramModalData({
        title: '',
        category: '비교과',
        field: '바이오',
        startDate: '',
        endDate: '',
        status: '모집중',
        maxParticipants: 10,
        requiresFile: false,
        score: 10,
        description: '',
        imageUrl: '',
        attachedFiles: []
      });
    } catch (error) {
      showAlert('프로그램 저장 중 오류가 발생했습니다.');
      console.error('프로그램 저장 오류:', error);
    }
  };

  const handleDeleteProgram = async (program) => {
    const confirmed = await showConfirm(`"${program.title}" 프로그램을 삭제하시겠습니까?`);
    if (confirmed) {
      try {
        await deleteProgram(program.id);
        showAlert('프로그램이 삭제되었습니다.');
      } catch (error) {
        showAlert('프로그램 삭제 중 오류가 발생했습니다.');
        console.error('프로그램 삭제 오류:', error);
      }
    }
  };

  const handleAddNotice = () => {
    setEditingNotice(null);
    setNoticeModalData({
      title: '',
      field: '전체',
      content: '',
      author: currentUser?.name || '관리자',
      date: new Date().toISOString().split('T')[0],
      views: 0,
      imageUrl: '',
      attachedFiles: []
    });
    setShowNoticeModal(true);
  };

  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setNoticeModalData({
      title: notice.title,
      field: notice.field,
      content: notice.content,
      author: notice.author,
      date: notice.date,
      views: notice.views,
      imageUrl: notice.imageUrl || '',
      attachedFiles: notice.attachedFiles || []
    });
    setShowNoticeModal(true);
  };

  const handleSaveNoticeModal = async () => {
    if (!noticeModalData.title || !noticeModalData.content) {
      showAlert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      await addOrUpdateNotice(noticeModalData, editingNotice);
      
      showAlert(editingNotice ? '공지사항이 수정되었습니다.' : '공지사항이 추가되었습니다.');
      setShowNoticeModal(false);
      setEditingNotice(null);
      setNoticeModalData({
        title: '',
        field: '전체',
        content: '',
        author: currentUser?.name || '관리자',
        date: new Date().toISOString().split('T')[0],
        views: 0,
        imageUrl: '',
        attachedFiles: []
      });
    } catch (error) {
      showAlert('공지사항 저장 중 오류가 발생했습니다.');
      console.error('공지사항 저장 오류:', error);
    }
  };

  const handleDeleteNotice = async (notice) => {
    const confirmed = await showConfirm(`"${notice.title}" 공지사항을 삭제하시겠습니까?`);
    if (confirmed) {
      try {
        await deleteNotice(notice.id);
        showAlert('공지사항이 삭제되었습니다.');
      } catch (error) {
        showAlert('공지사항 삭제 중 오류가 발생했습니다.');
        console.error('공지사항 삭제 오류:', error);
      }
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentModalData({
      studentId: '',
      name: '',
      department: '',
      field: '바이오',
      email: '',
      phone: '',
      password: '',
      memo: ''
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentModalData({
      studentId: student.studentId,
      name: student.name,
      department: student.department,
      field: student.field,
      email: student.email,
      phone: student.phone,
      password: student.password,
      memo: student.memo || ''
    });
    setShowStudentModal(true);
  };

  const handleSaveStudentModal = async () => {
    if (!studentModalData.studentId || !studentModalData.name || !studentModalData.department) {
      showAlert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!editingStudent && !studentModalData.password) {
      showAlert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      await addOrUpdateStudent(studentModalData, editingStudent);
      
      showAlert(editingStudent ? '학생 정보가 수정되었습니다.' : '학생이 추가되었습니다.');
      setShowStudentModal(false);
      setEditingStudent(null);
      setStudentModalData({
        studentId: '',
        name: '',
        department: '',
        field: '바이오',
        email: '',
        phone: '',
        password: '',
        memo: ''
      });
    } catch (error) {
      showAlert('학생 저장 중 오류가 발생했습니다.');
      console.error('학생 저장 오류:', error);
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmed = await showConfirm(`"${student.name}" 학생을 삭제하시겠습니까?\n\n학번: ${student.studentId}\n학과: ${student.department}`);
    if (confirmed) {
      try {
        await deleteStudent(student.id);
        showAlert('학생이 삭제되었습니다.');
      } catch (error) {
        showAlert('학생 삭제 중 오류가 발생했습니다.');
        console.error('학생 삭제 오류:', error);
      }
    }
  };

  const renderStudentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
        <div className="flex gap-3">
          <button
            onClick={downloadStudentsExcel}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📊 엑셀 다운로드
          </button>
          <button
            onClick={handleAddStudent}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + 학생 추가
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">학번</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">학과</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분야</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{student.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowStudentDetailModal(true);
                      }}
                      className="text-gray-900 hover:text-blue-600 hover:underline text-left"
                    >
                      {student.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{student.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.field === '바이오' ? 'bg-green-100 text-green-800' :
                      student.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {student.field}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{student.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="text-green-600 hover:text-green-800"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProgramsTab = () => {
    const getProgramApplicantCount = (programId) => {
      return programApplications.filter(
        app => app.programId === programId && 
               (app.status === 'pending' || app.status === 'approved' || app.status === 'completed')
      ).length;
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">프로그램 관리</h2>
          <div className="flex gap-3">
            <button
              onClick={downloadProgramsExcel}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              📊 엑셀 다운로드
            </button>
            <button
              onClick={handleAddProgram}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              + 프로그램 추가
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map(program => {
            const applicantCount = getProgramApplicantCount(program.id);
            const isFull = applicantCount >= program.maxParticipants;
            
            return (
              <div key={program.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex-1">{program.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 ${
                      program.status === '모집중' ? 'bg-green-100 text-green-800' :
                      program.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {program.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">분류:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        program.category === '비교과' ? 'bg-purple-100 text-purple-800' :
                        program.category === '산학협력' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {program.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">분야:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        program.field === '바이오' ? 'bg-green-100 text-green-800' :
                        program.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                        program.field === '물류' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {program.field}
                      </span>
                    </div>
                    <p><span className="font-semibold">기간:</span> {program.startDate} ~ {program.endDate}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">신청:</span>
                      <div className="relative inline-block">
                        <button
                          onClick={() => {
                            setSelectedProgramForApplicants(program);
                            setShowApplicantsModal(true);
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity ${
                            isFull 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                              : applicantCount >= program.maxParticipants * 0.8
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                          title="클릭하여 신청자 목록 보기"
                        >
                          {applicantCount}/{program.maxParticipants}명
                          {isFull && ' (마감)'}
                        </button>
                        {programApplications.filter(app => 
                          app.programId === program.id && app.status === 'pending'
                        ).length > 0 && (
                          <span className="absolute -top-2 -right-8 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-blue-600 font-bold">
                      <span className="font-semibold text-gray-600">점수:</span> {program.score}점
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowProgramDetailModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      상세
                    </button>
                    <button
                      onClick={() => handleEditProgram(program)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(program)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNoticesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">공지사항 관리</h2>
        <button
          onClick={handleAddNotice}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          + 공지사항 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분야</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">조회수</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredNotices.map(notice => (
              <tr key={notice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedNotice(notice);
                      setShowNoticeDetailModal(true);
                    }}
                    className="text-gray-900 hover:text-blue-600 hover:underline text-left w-full"
                  >
                    {notice.title}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    notice.field === '바이오' ? 'bg-green-100 text-green-800' :
                    notice.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                    notice.field === '물류' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {notice.field}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{notice.author}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{notice.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{notice.views}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleEditNotice(notice)}
                    className="text-green-600 hover:text-green-800"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteNotice(notice)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );



  const renderApprovalTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">회원가입 승인 관리</h2>
          <div className="text-sm text-gray-600">
            승인 대기: {pendingUsers?.length || 0}명
          </div>
        </div>

        <div className="space-y-4">
          {pendingUsers && pendingUsers.length > 0 ? (
            pendingUsers.map(user => (
              <div key={user.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        user.account_type === 'student' ? 'bg-blue-100 text-blue-800' :
                        user.account_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.account_type === 'student' ? '학생' :
                         user.account_type === 'admin' ? '교수' : '직원'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                        승인 대기
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><span className="font-semibold">아이디:</span> {user.username}</p>
                        {user.student_id && (
                          <p><span className="font-semibold">학번:</span> {user.student_id}</p>
                        )}
                        {user.department && (
                          <p><span className="font-semibold">학과:</span> {user.department}</p>
                        )}
                      </div>
                      <div>
                        {user.email && (
                          <p><span className="font-semibold">이메일:</span> {user.email}</p>
                        )}
                        {user.phone && (
                          <p><span className="font-semibold">전화번호:</span> {user.phone}</p>
                        )}
                        {user.field && (
                          <p>
                            <span className="font-semibold">분야:</span>{' '}
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              user.field === '바이오' ? 'bg-green-100 text-green-800' :
                              user.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {user.field}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={async () => {
                        try {
                          await approveUser(user.id);
                          showAlert(`${user.name}님의 가입이 승인되었습니다.`);
                        } catch (error) {
                          showAlert('승인 처리 중 오류가 발생했습니다.');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await showConfirm(
                          `${user.name}님의 가입을 거부하시겠습니까?\n\n거부 시 해당 계정은 삭제됩니다.`
                        );
                        if (confirmed) {
                          try {
                            await rejectUser(user.id);
                            showAlert(`${user.name}님의 가입이 거부되었습니다.`);
                          } catch (error) {
                            showAlert('거부 처리 중 오류가 발생했습니다.');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      거부
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">승인 대기 중인 회원가입 요청이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* 로고 추가 */}
              <div className="bg-white p-2 rounded-lg">
                <img 
                  src="/image/INU_RISE_logo.png" 
                  alt="RISE 사업단" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">학생성공지수 관리 시스템</h1>
                <p className="text-blue-100 mt-1">
                  {currentUser?.role === 'master' ? '마스터' : '관리자'} {currentUser?.name}님 환영합니다
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'students'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              학생 관리
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'programs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              프로그램 관리
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'notices'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              공지사항 관리
            </button>
            <button
              onClick={() => setActiveTab('coreCoursesSettings')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'coreCoursesSettings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              ⚙️ 교과목 설정
            </button>
            <button
              onClick={() => setActiveTab('coreCoursesReview')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'coreCoursesReview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📊 교과목 검토
            </button>
            {currentUser?.role === 'master' && (
              <button
                onClick={() => setActiveTab('approval')}
                className={`flex-1 px-6 py-4 font-semibold ${
                  activeTab === 'approval'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span className="relative inline-block">
                  승인 관리
                  {pendingUsers.length > 0 && (
                    <span className="absolute -top-1 -right-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {(activeTab === 'students' || activeTab === 'programs' || activeTab === 'notices') && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체 분야</option>
                <option value="바이오">바이오</option>
                <option value="반도체">반도체</option>
                <option value="물류">물류</option>
              </select>
            </div>
          </div>
        )}

        <div>
          {activeTab === 'students' && renderStudentsTab()}
          {activeTab === 'programs' && renderProgramsTab()}
          {activeTab === 'notices' && renderNoticesTab()}
          {activeTab === 'approval' && renderApprovalTab()}
          {activeTab === 'coreCoursesSettings' && <CoreCoursesSettingPage />}
          {activeTab === 'coreCoursesReview' && <CoreCoursesReviewPage />}
        </div>
      </div>

      {showStudentDetailModal && selectedStudent && (
        <StudentDetailModal
          isOpen={showStudentDetailModal}
          onClose={() => {
            setShowStudentDetailModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
        />
      )}

      {showProgramDetailModal && selectedProgram && (
        <ProgramDetailModal
          isOpen={showProgramDetailModal}
          onClose={() => {
            setShowProgramDetailModal(false);
            setSelectedProgram(null);
          }}
          program={selectedProgram}
        />
      )}

      {showNoticeDetailModal && selectedNotice && (
        <NoticeDetailModal
          isOpen={showNoticeDetailModal}
          onClose={() => {
            setShowNoticeDetailModal(false);
            setSelectedNotice(null);
          }}
          notice={selectedNotice}
        />
      )}

      {showProgramModal && (
        <ProgramModal
          isOpen={showProgramModal}
          onClose={() => {
            setShowProgramModal(false);
            setEditingProgram(null);
          }}
          program={editingProgram}
        />
      )}

      {showNoticeModal && (
        <NoticeModal
          isOpen={showNoticeModal}
          onClose={() => {
            setShowNoticeModal(false);
            setEditingNotice(null);
          }}
          notice={editingNotice}
        />
      )}

      {showStudentModal && (
        <StudentFormModal
          isOpen={showStudentModal}
          onClose={() => {
            setShowStudentModal(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudentModal}
          studentData={studentModalData}
          setStudentData={setStudentModalData}
          isEditing={!!editingStudent}
        />
      )}

      {/* 신청자 모달 */}
      {showApplicantsModal && selectedProgramForApplicants && (
        <ApplicantsModal
          program={selectedProgramForApplicants}
          onClose={() => {
            setShowApplicantsModal(false);
            setSelectedProgramForApplicants(null);
          }}
        />
      )}
    </div>
  );
}

// 🔥 프로그램 추가/수정 모달 (이미지 및 파일 첨부 포함)
function StudentFormModal({ isOpen, onClose, onSave, studentData, setStudentData, isEditing }) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{isEditing ? '학생 수정' : '학생 추가'}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">학번 *</label>
              <input
                type="text"
                name="studentId"
                value={studentData.studentId}
                onChange={handleChange}
                disabled={isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="학번"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
              <input
                type="text"
                name="name"
                value={studentData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="이름"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">학과 *</label>
              <input
                type="text"
                name="department"
                value={studentData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="학과"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">분야</label>
              <select
                name="field"
                value={studentData.field}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="바이오">바이오</option>
                <option value="반도체">반도체</option>
                <option value="물류">물류</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                name="email"
                value={studentData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="이메일"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
              <input
                type="tel"
                name="phone"
                value={studentData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="전화번호"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 *</label>
              <input
                type="password"
                name="password"
                value={studentData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
            <textarea
              name="memo"
              value={studentData.memo}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="메모"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            {isEditing ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;