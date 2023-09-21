import { Text, View } from '@react-pdf/renderer';
import { Style } from '@react-pdf/types';

import { styles as rootStyles } from '../styles.js';

interface ListItemProps {
  content: string;
  styles?: Style | Style[];
  // children?: ReactNode;
}

export const ListItem = ({ content, styles }: ListItemProps) => {
  let stylesArr: Style[] = [];
  if (styles) stylesArr = styles && Array.isArray(styles) ? styles : [styles];

  return (
    <View style={[rootStyles.listItem]}>
      <Text style={[rootStyles.listItemBullet]}>•</Text>
      <Text style={[rootStyles.paragraph, rootStyles.textPrimary, ...stylesArr]}>{content}</Text>
      {/* {children} */}
    </View>
  );
};

interface InsetListItemProps {
  insetLevel?: number;
  children: JSX.Element;
}

export const InsetWrapper = ({ insetLevel = 1, children }: InsetListItemProps) => {
  const ml = insetLevel * 20;
  return <View style={{ marginLeft: ml }}>{children}</View>;
};

interface OrderedListItemProps {
  number: number | string;
  content: string;
  styles?: Style | Style[];
  noParens?: boolean;
}

export const OrderedListItem = ({ number, content, styles, noParens }: OrderedListItemProps) => {
  let stylesArr: Style[] = [];
  if (styles) stylesArr = styles && Array.isArray(styles) ? styles : [styles];

  return (
    <View style={[rootStyles.listItem]}>
      <Text style={[rootStyles.listItemBullet]}>{`${number}${noParens ? '' : ')'}`}</Text>
      <Text
        style={[
          rootStyles.paragraph,
          rootStyles.textPrimary,
          // rootStyles.grow,
          // rootStyles.zeroMinWidth,
          ...stylesArr,
        ]}
      >
        {content}
      </Text>
    </View>
  );
};
