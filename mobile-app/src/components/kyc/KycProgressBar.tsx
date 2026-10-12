import { View, Text, StyleSheet } from 'react-native';

/**
 * Shared animated step progress bar for KYC flows.
 *
 * Props:
 * - step: current step (1-based)
 * - labels: array of label strings for each step
 */
interface KycProgressBarProps {
  step: number;
  labels: string[];
}

export function KycProgressBar({ step, labels }: KycProgressBarProps) {
  return (
    <View style={pb.container}>
      {labels.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <View key={label} style={pb.stepWrap}>
            <View style={[pb.circle, done && pb.circleDone, active && pb.circleActive]}>
              {done ? (
                <Text style={pb.checkmark}>✓</Text>
              ) : (
                <Text style={[pb.num, active && pb.numActive]}>{num}</Text>
              )}
            </View>
            <Text style={[pb.label, active && pb.labelActive]}>{label}</Text>
            {i < labels.length - 1 && (
              <View style={[pb.line, done && pb.lineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const pb = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepWrap: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7E3DA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleDone: { backgroundColor: '#00704A' },
  circleActive: { backgroundColor: '#00704A' },
  num: { fontSize: 13, fontWeight: '600', color: '#8F9892' },
  numActive: { color: '#FFFFFF' },
  checkmark: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  label: { fontSize: 11, color: '#8F9892', marginTop: 4, textAlign: 'center' },
  labelActive: { color: '#00704A', fontWeight: '600' },
  line: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E7E3DA',
    zIndex: 1,
  },
  lineDone: { backgroundColor: '#00704A' },
});
