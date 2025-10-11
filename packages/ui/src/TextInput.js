import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const TextInput = ({
  label,
  error,
  helperText,
  required = false,
  style,
  left,
  right,
  ...props
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <PaperTextInput
        label={required ? `${label} *` : label}
        mode="outlined"
        error={!!error}
        theme={{
          colors: {
            primary: theme.colors.primary,
            error: theme.colors.error,
          },
        }}
        outlineStyle={{
          borderColor: error ? theme.colors.error : theme.colors.outline,
        }}
        style={styles.input}
        left={left}
        right={right}
        {...props}
      />
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.colors.error : theme.colors.text.secondary,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});

export default TextInput;
