export const calculateStudentScore = (student) => {
  const nonCurricular = student.nonCurricularHistory.reduce((sum, h) => sum + h.score, 0);
  const coreSubject = student.coreSubjectHistory.reduce((sum, h) => sum + h.score, 0);
  const industry = student.industryHistory.reduce((sum, h) => sum + h.score, 0);
  
  return {
    nonCurricularScore: nonCurricular,
    coreSubjectScore: coreSubject,
    industryScore: industry,
    total: nonCurricular + coreSubject + industry
  };
};

export const getApplicationStatus = (application) => {
  if (application.status === 'pending') {
    return { status: '대기중', color: 'bg-yellow-100 text-yellow-800' };
  } else if (application.status === 'approved') {
    return { status: '승인됨', color: 'bg-blue-100 text-blue-800' };
  } else if (application.status === 'rejected') {
    return { status: '거부됨', color: 'bg-red-100 text-red-800' };
  } else if (application.status === 'completed') {
    return { status: '이수완료', color: 'bg-green-100 text-green-800' };
  }
  return { status: '알 수 없음', color: 'bg-gray-100 text-gray-800' };
};