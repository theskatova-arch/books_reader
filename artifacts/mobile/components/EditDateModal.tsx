import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColors } from '@/hooks/useColors';

interface EditDateModalProps {
  visible: boolean;
  title: string;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/** Parses a YYYY-MM-DD string into a local-midnight Date, or returns null. */
function parseLocalDate(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function EditDateModal({
  visible,
  title,
  date,
  onConfirm,
  onCancel,
}: EditDateModalProps) {
  const colors = useColors();
  const [picked, setPicked] = useState(date);
  // web fallback state
  const [textValue, setTextValue] = useState(toYMD(date));
  const [textError, setTextError] = useState(false);

  // Reset local state whenever the modal opens with a new date
  React.useEffect(() => {
    if (visible) {
      setPicked(date);
      setTextValue(toYMD(date));
      setTextError(false);
    }
  }, [visible, date]);

  const handleConfirm = () => {
    if (Platform.OS === 'web') {
      const parsed = parseLocalDate(textValue);
      if (!parsed) { setTextError(true); return; }
      onConfirm(parsed);
    } else {
      onConfirm(picked);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

          {Platform.OS === 'web' ? (
            /* Web: plain text input YYYY-MM-DD */
            <View style={styles.webInputWrapper}>
              <TextInput
                style={[
                  styles.webInput,
                  {
                    color: colors.foreground,
                    borderColor: textError ? colors.destructive : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={textValue}
                onChangeText={(v) => { setTextValue(v); setTextError(false); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              {textError && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  Enter a valid date (YYYY-MM-DD)
                </Text>
              )}
            </View>
          ) : (
            /* Native: inline date picker */
            <DateTimePicker
              value={picked}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_e, d) => { if (d) setPicked(d); }}
              style={styles.picker}
            />
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnLabel, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnLabel, { color: colors.primaryForeground }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  picker: {
    height: 180,
  },
  webInputWrapper: {
    gap: 6,
  },
  webInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
