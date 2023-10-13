import { Font, StyleSheet } from '@react-pdf/renderer';
import { wordHyphenation } from './wordHyphenation.js';

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
      fontWeight: 400,
      fontStyle: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu52xP.ttf',
      fontWeight: 400,
      fontStyle: 'italic',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5vAw.ttf',
      fontWeight: 300,
      fontStyle: 'light',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAw.ttf',
      fontWeight: 500,
      fontStyle: 'medium',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
      fontWeight: 600,
      fontStyle: 'semi-bold',
    },
  ],
});
Font.register({
  family: 'Source Sans Pro',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/sourcecodepro/v22/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DMyQhM4.ttf',
      fontWeight: 400,
      fontStyle: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/sourcecodepro/v22/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DJKQhM4.ttf',
      fontWeight: 300,
      fontStyle: 'light',
    },
    {
      src: 'https://fonts.gstatic.com/s/sourcecodepro/v22/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DP6QhM4.ttf',
      fontWeight: 500,
      fontStyle: 'medium',
    },
    {
      src: 'https://fonts.gstatic.com/s/sourcecodepro/v22/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DBKXhM4.ttf',
      fontWeight: 600,
      fontStyle: 'semi-bold',
    },
  ],
});
Font.register({
  family: 'Stalemate',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/stalemate/v20/taiIGmZ_EJq97-UfkZRpug.ttf',
      fontWeight: 400,
    },
  ],
});

Font.registerHyphenationCallback(wordHyphenation);

const TEXT_PRIMARY = '#1A2027';
const TEXT_SECONDARY = '#3E5060';
const BG_LIGHT = '#F3F6F9';
const DIVIDER = '#E7EBF0';

export const styles = StyleSheet.create({
  page: {
    // flexDirection: 'row',
    // backgroundColor: '#E4E4E4',
    padding: 40,
    justifyContent: 'flex-start',
  },
  section: {
    margin: 8,
    padding: 8,
    // flexGrow: 1,
  },
  flexSection: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  headerLogo: {
    height: '50px',
    width: '140px',
    marginBottom: 0,
    marginHorizontal: 100,
  },
  heading: {
    fontSize: 24,
    fontWeight: 600,
    color: '#131925',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 16,
    fontWeight: 500,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 400,
    paddingBottom: 10,
  },
  statement: {
    fontSize: 20,
    color: '#131925',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  upper: {
    textTransform: 'uppercase',
  },
  robotoItalic: {
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    fontWeight: 400,
  },
  robotoBold: {
    fontFamily: 'Roboto',
    fontWeight: 600,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: DIVIDER, // '#999999',
    margin: '24px 0 24px 0',
  },
  paragraph: {
    fontFamily: 'Roboto',
    fontSize: 12,
    // color: '#212935',
    lineHeight: 1.64,
    // lineHeight: 1.5,
  },
  body2: {
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.5,
    color: TEXT_SECONDARY,
  },
  textPrimary: {
    // fontFamily: 'Roboto',
    color: TEXT_PRIMARY,
  },
  textSecondary: {
    // fontFamily: 'Roboto',
    color: TEXT_SECONDARY,
  },
  columnParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnStart: {
    flex: 1,
  },
  columnEnd: {
    flex: 1,
    alignItems: 'flex-end',
  },
  grow: {
    flex: '1 0 auto',
  },
  overline: {
    color: TEXT_SECONDARY,
    fontFamily: 'Source Sans Pro', //  'Courier',
    fontSize: '9px',
    textTransform: 'uppercase',
    lineHeight: 1.6,
    paddingBottom: 4,
  },
  blockPrimaryText: {
    fontFamily: 'Roboto',
    fontSize: '12px',
    paddingBottom: 6,
    whiteSpace: 'normal',
  },
  blockSecondaryText: {
    fontFamily: 'Roboto',
    fontSize: '9px',
    lineHeight: 1.5,
  },
  textCenter: {
    textAlign: 'center',
  },
  pageNumbers: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Source Sans Pro',
  },
  signature: {
    fontFamily: 'Stalemate',
    fontSize: 32,
    lineHeight: 1,
  },
  signatureBox: {
    padding: 2,
    marginBottom: 6,
    borderColor: '#1A2027',
    // borderColor: '#cc0000',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    width: 180,
  },
  headerContainer: {
    backgroundColor: '#F3F6F9', //'#eee',
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    padding: 8,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeader: {
    fontSize: 10,
    fontFamily: 'Source Sans Pro',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    maxWidth: '100%',
    fontSize: 10,
    fontFamily: 'Roboto',
    marginBottom: 6,
    // marginRight: 40, // HACK - overflows container on the right
    paddingRight: 40,
  },
  listItemBullet: {
    // marginHorizontal: 12,
    paddingHorizontal: 12,
    // flex: '0 0 auto',
    // fontSize: 11,
    fontFamily: 'Source Sans Pro',
    minWidth: 12,
  },
  // insetListItem: {
  //   marginLeft: 20,
  // },
  disclosure: {
    fontSize: 12,
    fontFamily: 'Roboto',
  },
  zeroMinWidth: {
    minWidth: 0,
  },
  padV: {
    paddingVertical: 10,
  },
  padB: {
    paddingBottom: 10,
  },
  // disclosureTN: {
  //   color: 'red',
  // }, // TODO: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
  // extends MappedDisclosureState type
});

export const tableStyles = StyleSheet.create({
  table: {
    fontSize: 10,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    // alignContent: 'stretch',
    flexWrap: 'nowrap',
    // alignItems: 'stretch',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    // alignContent: 'stretch',
    flexWrap: 'nowrap',
    // alignItems: 'stretch',
    flexGrow: 1,
    flexShrink: 0,
    borderColor: DIVIDER,
    borderStyle: 'solid',
    borderBottomWidth: 1,
  },
  cell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    // flex: '0 0 auto',
    // alignSelf: 'stretch',
    // alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    display: 'flex',
    flexDirection: 'column', // 'row',
    justifyContent: 'flex-start',
    // border: `1px solid lightblue`,
  },
  header: {
    backgroundColor: BG_LIGHT,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  headerText: {
    fontFamily: 'Source Sans Pro',
    fontSize: 9,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    // fontWeight: 500,
    color: TEXT_SECONDARY,
    // margin: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    // border: `1px solid magenta`,
  },
  tableText: {
    margin: 8,
    fontSize: 10,
    color: TEXT_PRIMARY,
  },
  addressContainer: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '180px',
    // alignItems: 'stretch',
  },
  addressText: {
    // border: `1px solid lightgrey`,
  },
  // breakLongWords: {
  //   whiteSpace: 'normal',
  //   overflowWrap: 'break-word',
  //   wordWrap: 'break-word',
  //   wordBreak: 'break-all',
  //   hyphens: 'none', //  'auto',
  // },
});
