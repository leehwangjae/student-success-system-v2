export const DEPARTMENT_OPTIONS = [
  '생명과학전공',
  '분자의생명전공', 
  '생명공학전공',
  '나노바이오공학전공',
  '전자공학부',
  '동북아국제통상물류학부',
  '물류학 연계전공',
  '글로벌무역물류학과',
  '기타'
];

export const FIELD_OPTIONS = ['공통', '바이오 분야', '반도체 분야', '물류 분야'];

export const getDepartmentField = (department) => {
  if (['생명과학전공', '분자의생명전공', '생명공학전공', '나노바이오공학전공'].includes(department)) {
    return '바이오 분야';
  }
  if (department === '전자공학부') {
    return '반도체 분야';
  }
  if (['동북아국제통상물류학부', '물류학 연계전공', '글로벌무역물류학과'].includes(department)) {
    return '물류 분야';
  }
  return '기타';
};