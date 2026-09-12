import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../../theme';

type PhotoCardProps = {
  imageUrl: string | null;
  kicker: string;
  title: string;
  meta?: string | null;
  testID?: string;
};

export function PhotoCard({ imageUrl, kicker, title, meta, testID }: PhotoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <View style={styles.plain} testID={testID}>
        <Text style={styles.kicker}>{kicker}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <View style={styles.rule} />
        <Text style={styles.plainTitle}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.photoWrap} testID={testID}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.photo}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
      <View style={styles.scrim} />
      <View style={styles.topShade} />
      <View style={styles.caption}>
        <Text style={styles.kicker}>{kicker}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.photoTitle} numberOfLines={4}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  photo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundColor: 'rgba(12, 12, 12, 0.38)',
  },
  caption: {
    paddingHorizontal: 24,
    paddingBottom: 72,
    paddingTop: 28,
    backgroundColor: colors.overlayDeep,
  },
  kicker: {
    color: colors.gold,
    fontSize: type.kicker,
    fontWeight: '500',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.ivoryMuted,
    fontSize: type.caption,
    marginTop: 8,
    letterSpacing: 0.8,
  },
  photoTitle: {
    color: colors.ivory,
    fontSize: type.title,
    fontWeight: '400',
    lineHeight: 44,
    marginTop: 12,
  },
  plain: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    maxWidth: 720,
    alignSelf: 'center',
  },
  rule: {
    width: 48,
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: 18,
    borderRadius: 1,
  },
  plainTitle: {
    color: colors.ivory,
    fontSize: type.body,
    lineHeight: 40,
    fontWeight: '400',
  },
});
