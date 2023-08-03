import { Text, View } from '@react-pdf/renderer';

import { styles } from '../styles';

export function EndorsementReadCarefully() {
  return (
    <View
      style={{
        borderBottom: '2px solid #007DFF',
        borderTop: '2px solid #007DFF',
        paddingHorizontal: 16,
        paddingTop: 10,
        marginHorizontal: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Text style={[styles.paragraph, styles.robotoItalic]}>
        This Endorsement Changes the Policy
      </Text>
      <Text style={[styles.heading2, styles.upper]}>Please read it carefully</Text>
    </View>
  );
}
