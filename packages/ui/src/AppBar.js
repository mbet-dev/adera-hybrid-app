import React from 'react';
import { Appbar } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const AppBar = ({ 
  title, 
  subtitle,
  onBack, 
  actions = [], 
  style,
  elevated = true,
  ...props 
}) => {
  const theme = useTheme();

  return (
    <Appbar.Header 
      style={[
        {
          backgroundColor: theme.colors.primary,
          elevation: elevated ? 4 : 0,
        },
        style
      ]}
      {...props}
    >
      {onBack && (
        <Appbar.BackAction 
          onPress={onBack}
          iconColor={theme.colors.onPrimary}
        />
      )}
      
      <Appbar.Content 
        title={title}
        subtitle={subtitle}
        titleStyle={{ color: theme.colors.onPrimary }}
        subtitleStyle={{ color: theme.colors.onPrimary }}
      />
      
      {actions.map((action, index) => (
        <Appbar.Action
          key={index}
          icon={action.icon}
          onPress={action.onPress}
          iconColor={theme.colors.onPrimary}
          disabled={action.disabled}
        />
      ))}
    </Appbar.Header>
  );
};

export default AppBar;
