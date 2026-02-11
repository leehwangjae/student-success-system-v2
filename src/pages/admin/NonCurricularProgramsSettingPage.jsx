import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PROGRAM_CATEGORIES, FIELD_DEPARTMENTS } from '../../components/nonCurricularPrograms/constants';
import { useModalStore } from '../../hooks/useModal';
import * as XLSX from 'xlsx';

function NonCurricularProgramsSettingPage() {
  const { nonCurricularPrograms, addNonCurricularProgram, updateNonCurricularProgram, deleteNonCurricularProgram } = useAppContext();
  const { showAlert, showConfirm } = useModalStore();

  const [selectedField, setSelectedField] = useState('바이오');
  const [selectedDepartment, setSelectedDepartment] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const fileInputRef = useRef(null);

  // 체크박스 관련 상태
  const [selectedPrograms, setSelectedPrograms] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [modalData, setModalData] = useState({
    programName: '',
    category: '취업역량',
    field: '바이오',
    department: FIELD_DEPARTMENTS['바이오'][0],
    score: 10,
    description: ''
  });

  // 필터링된 프로그램
  const filteredPrograms = useMemo(() => {
    return (nonCurricularPrograms || []).filter(program => {
      const matchesField = program.field === selectedField;
      const matchesDepartment = selectedDepartment === '전체' || program.department === selectedDepartment;
      const matchesCategory = selectedCategory === '전체' || program.category === selectedCategory;
      const matchesSearch = program.program_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesField && matchesDepartment && matchesCategory && matchesSearch;
    });
  }, [nonCurricularPrograms, selectedField, selectedDepartment, selectedCategory, searchTerm]);

  // 정렬된 프로그램
  const sortedPrograms = useMemo(() => {
    if (!sortConfig.key) return filteredPrograms;
    const sorted = [...filteredPrograms].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'score') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      aVal = (aVal || '').toString();
      bVal = (bVal || '').toString();
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal, 'ko')
        : bVal.localeCompare(aVal, 'ko');
    });
    return sorted;
  }, [filteredPrograms, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <span className="inline-flex flex-col ml-1 -space-y-1">
        <svg className={`w-3 h-3 ${isActive && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M5 0L10 6H0z" />
        </svg>
        <svg className={`w-3 h-3 ${isActive && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M5 6L0 0h10z" />
        </svg>
      </span>
    );
  };

  const handleAddProgram = () => {
    setEditingProgram(null);
    setModalData({
      programName: '',
      category: '취업역량',
      field: selectedField,
      department: selectedDepartment !== '전체' ? selectedDepartment : FIELD_DEPARTMENTS[selectedField][0],
      score: 10,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setModalData({
      programName: program.program_name,
      category: program.category,
      field: program.field,
      department: program.department,
      score: program.score,
      description: program.description || ''
    });
    setIsModalOpen(true);
  };

  const handleFieldChange = (newField) => {
    setSelectedField(newField);
    setSelectedDepartment('전체');
  };

  const handleSaveProgram = async () => {
    if (!modalData.programName.trim()) {
      showAlert('프로그램명을 입력해주세요.');
      return;
    }

    try {
      if (editingProgram) {
        await updateNonCurricularProgram(editingProgram.id, modalData);
        showAlert('프로그램이 수정되었습니다.');
      } else {
        await addNonCurricularProgram(modalData);
        showAlert('프로그램이 추가되었습니다.');
      }
      setIsModalOpen(false);
    } catch (error) {
      showAlert('오류: ' + error.message);
    }
  };

  const handleDeleteProgram = async (program) => {
    const confirmed = await showConfirm(
      `"${program.programName}" 프로그램을 삭제하시겠습니까?\n\n해당 프로그램의 학생 제출 데이터도 함께 삭제됩니다.`
    );
    if (confirmed) {
      try {
        await deleteNonCurricularProgram(program.id);
        showAlert('프로그램이 삭제되었습니다.');
      } catch (error) {
        showAlert('삭제 실패: ' + error.message);
      }
    }
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPrograms(sortedPrograms.map(p => p.id));
    } else {
      setSelectedPrograms([]);
    }
  };

  // 개별 체크박스 토글
  const handleSelectProgram = (programId) => {
    setSelectedPrograms(prev =>
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  // 선택된 항목 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedPrograms.length === 0) {
      showAlert('삭제할 프로그램을 선택해주세요.');
      return;
    }

    const confirmed = await showConfirm(
      `선택한 ${selectedPrograms.length}개의 프로그램을 삭제하시겠습니까?\n\n해당 프로그램들의 학생 제출 데이터도 함께 삭제됩니다.`
    );

    if (confirmed) {
      let successCount = 0;
      let failCount = 0;

      for (const programId of selectedPrograms) {
        try {
          await deleteNonCurricularProgram(programId);
          successCount++;
        } catch (error) {
          failCount++;
        }
      }

      showAlert(`삭제 완료\n성공: ${successCount}개, 실패: ${failCount}개`);
      setSelectedPrograms([]);
    }
  };

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '프로그램명': '취업역량 강화 프로그램',
        '분야': '바이오',
        '전공': '생명과학전공',
        '카테고리': '취업역량',
        '점수': 10,
        '설명': '취업 역량 향상을 위한 프로그램'
      },
      {
        '프로그램명': '산학협력 현장실습',
        '분야': '바이오',
        '전공': '나노바이오공학전공',
        '카테고리': '산학협력',
        '점수': 15,
        '설명': '기업 현장 실습 프로그램'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '비교과프로그램');

    worksheet['!cols'] = [
      { wch: 40 }, // 프로그램명
      { wch: 10 }, // 분야
      { wch: 25 }, // 전공
      { wch: 12 }, // 카테고리
      { wch: 8 },  // 점수
      { wch: 50 }  // 설명
    ];

    XLSX.writeFile(workbook, `비교과프로그램_템플릿_${selectedField}.xlsx`);
    showAlert('템플릿이 다운로드되었습니다.');
  };

  // 엑셀 업로드
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let failCount = 0;

        for (const row of jsonData) {
          // 엑셀 데이터에서 분야 추출 (필수)
          const excelField = row['분야'];
          if (!excelField) {
            console.warn('분야 정보가 없는 행 건너뜀:', row);
            failCount++;
            continue;
          }

          // 엑셀 데이터에서 전공 추출 (필수)
          const excelDepartment = row['전공'];
          if (!excelDepartment) {
            console.warn('전공 정보가 없는 행 건너뜀:', row);
            failCount++;
            continue;
          }

          const programData = {
            programName: row['프로그램명'],
            field: excelField,  // 엑셀의 분야 값 사용
            department: excelDepartment,  // 엑셀의 전공 값 사용
            category: row['카테고리'] || '취업역량',
            score: parseInt(row['점수']) || 10,
            description: row['설명'] || ''
          };

          if (!programData.programName) {
            failCount++;
            continue;
          }

          try {
            await addNonCurricularProgram(programData);
            successCount++;
          } catch (error) {
            failCount++;
          }
        }

        showAlert(`업로드 완료\n성공: ${successCount}개, 실패: ${failCount}개`);

        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        showAlert('엑셀 파일 읽기 실패: ' + error.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExcelDownload = () => {
    const excelData = sortedPrograms.map(program => ({
      '프로그램명': program.program_name,
      '분야': program.field,
      '전공': program.department,
      '카테고리': program.category,
      '점수': program.score,
      '설명': program.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '비교과프로그램');

    worksheet['!cols'] = [
      { wch: 40 }, // 프로그램명
      { wch: 10 }, // 분야
      { wch: 20 }, // 전공
      { wch: 12 }, // 카테고리
      { wch: 8 },  // 점수
      { wch: 50 }  // 설명
    ];

    XLSX.writeFile(workbook, `비교과프로그램_${selectedField}_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert('엑셀 다운로드가 완료되었습니다.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">⚙️ 비교과 프로그램 설정</h1>

          {/* 필터 */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">분야</label>
              <select
                value={selectedField}
                onChange={(e) => handleFieldChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="바이오">바이오</option>
                <option value="반도체">반도체</option>
                <option value="물류">물류</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전공</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                {FIELD_DEPARTMENTS[selectedField].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="취업역량">취업역량</option>
                <option value="산학협력">산학협력</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="프로그램명 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">등록된 프로그램:</span>
              <span className="font-bold text-blue-600">{filteredPrograms.length}개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">총 점수:</span>
              <span className="font-bold text-green-600">
                {filteredPrograms.reduce((sum, p) => sum + p.score, 0)}점
              </span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={handleAddProgram}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                프로그램 추가
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                엑셀 업로드
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                템플릿 다운로드
              </button>
              <button
                onClick={handleExcelDownload}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                현재 목록 다운로드
              </button>
            </div>
            {selectedPrograms.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                선택 삭제 ({selectedPrograms.length})
              </button>
            )}
          </div>
        </div>

        {/* 프로그램 리스트 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {sortedPrograms.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 text-lg mb-4">등록된 프로그램이 없습니다.</p>
              <button
                onClick={handleAddProgram}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                첫 번째 프로그램 추가하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.length === sortedPrograms.length && sortedPrograms.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('programName')}
                    >
                      <span className="inline-flex items-center">프로그램명 <SortIcon columnKey="programName" /></span>
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('department')}
                    >
                      <span className="inline-flex items-center justify-center">전공 <SortIcon columnKey="department" /></span>
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('category')}
                    >
                      <span className="inline-flex items-center justify-center">카테고리 <SortIcon columnKey="category" /></span>
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                      onClick={() => handleSort('score')}
                    >
                      <span className="inline-flex items-center justify-center">점수 <SortIcon columnKey="score" /></span>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPrograms.map((program, index) => (
                    <tr key={program.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedPrograms.includes(program.id)}
                          onChange={() => handleSelectProgram(program.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{program.program_name}</div>
                        {program.description && (
                          <div className="text-xs text-gray-500 mt-1">{program.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {program.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          program.category === '취업역량' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {program.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-blue-600">{program.score}점</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleEditProgram(program)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(program)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 프로그램 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-bold">
                {editingProgram ? '프로그램 수정' : '프로그램 추가'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로그램명 *
                </label>
                <input
                  type="text"
                  value={modalData.programName}
                  onChange={(e) => setModalData(prev => ({ ...prev, programName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 취업 역량 강화 프로그램"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={modalData.category}
                    onChange={(e) => setModalData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="취업역량">취업역량</option>
                    <option value="산학협력">산학협력</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    분야 *
                  </label>
                  <select
                    value={modalData.field}
                    onChange={(e) => setModalData(prev => ({
                      ...prev,
                      field: e.target.value,
                      department: FIELD_DEPARTMENTS[e.target.value][0]
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="바이오">바이오</option>
                    <option value="반도체">반도체</option>
                    <option value="물류">물류</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전공 *
                  </label>
                  <select
                    value={modalData.department}
                    onChange={(e) => setModalData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_DEPARTMENTS[modalData.field].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  점수 *
                </label>
                <input
                  type="number"
                  value={modalData.score}
                  onChange={(e) => setModalData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={modalData.description}
                  onChange={(e) => setModalData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="프로그램에 대한 간단한 설명을 입력하세요."
                />
              </div>
            </div>

            <div className="border-t px-6 py-4 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleSaveProgram}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                {editingProgram ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NonCurricularProgramsSettingPage;
