export const CERTIFICATE_TEMPLATE_PATH = '/assets/images/certificate_template.png';
export const CERTIFICATE_ALEGREYA_PATH = '/assets/fonts/Alegreya-VariableFont_wght.ttf';
export const CERTIFICATE_GREAT_VIBES_PATH = '/assets/fonts/GreatVibes-Regular.ttf';

export const CERTIFICATE_WIDTH = 2000;
export const CERTIFICATE_HEIGHT = 1414;
export const CERTIFICATE_PASSING_PERCENTAGE = 70;

export const CERTIFICATE_COLORS = {
  navy: '#113f86',
  black: '#111111',
};

export const CERTIFICATE_TEXT_LAYOUT = {
  subjectHeader: {
    centerX: 1000,
    centerY: 330,
    maxWidth: 1580,
    color: CERTIFICATE_COLORS.navy,
    fontFamily: 'Alegreya Certificate',
    fontWeight: 500,
    fontSize: 74,
    minFontSize: 40,
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  classroomHeader: {
    centerX: 1000,
    centerY: 432,
    maxWidth: 1100,
    color: CERTIFICATE_COLORS.navy,
    fontFamily: 'Alegreya Certificate',
    fontWeight: 500,
    fontSize: 72,
    minFontSize: 38,
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  studentName: {
    centerX: 1000,
    centerY: 748,
    maxWidth: 1420,
    color: CERTIFICATE_COLORS.navy,
    fontFamily: 'Great Vibes',
    fontWeight: 400,
    fontSize: 170,
    minFontSize: 104,
  },
  completionText: {
    centerX: 1000,
    centerY: 994,
    maxWidth: 760,
    color: CERTIFICATE_COLORS.black,
    fontFamily: 'Alegreya Certificate',
    fontWeight: 700,
    fontSize: 32,
    minFontSize: 20,
  },
  teacherName: {
    centerX: 1435,
    centerY: 1202,
    maxWidth: 520,
    color: CERTIFICATE_COLORS.navy,
    fontFamily: 'Alegreya Certificate',
    fontWeight: 600,
    fontSize: 28,
    minFontSize: 20,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
} as const;
