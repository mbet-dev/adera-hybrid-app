import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Dialog, Portal, List, Divider } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const DemoRoleSwitcher = ({ currentRole, onRoleChange }) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const roles = [
    { key: 'customer', label: '📦 Customer', description: 'Send and track parcels' },
    { key: 'partner', label: '🏪 Partner', description: 'Manage shop and scan QR codes' },
    { key: 'driver', label: '🚚 Driver', description: 'Deliver parcels and manage routes' },
    { key: 'staff', label: '👨‍💼 Staff', description: 'Monitor system and provide support' },
    { key: 'admin', label: '👑 Admin', description: 'Full system administration' },
  ];

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const selectRole = (role) => {
    onRoleChange(role);
    hideDialog();
  };

  const currentRoleInfo = roles.find(r => r.key === currentRole);

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        onPress={showDialog}
        style={[styles.button, { borderColor: theme.colors.primary }]}
        labelStyle={{ color: theme.colors.primary }}
      >
        🎭 Demo Mode: {currentRoleInfo?.label || 'Customer'}
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Choose Demo Role</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.description}>
              Switch between different user roles to test all features of the Adera app.
            </Text>
            
            <View style={styles.rolesList}>
              {roles.map((role, index) => (
                <View key={role.key}>
                  <List.Item
                    title={role.label}
                    description={role.description}
                    onPress={() => selectRole(role.key)}
                    left={() => <List.Icon icon="account" />}
                    style={[
                      styles.roleItem,
                      currentRole === role.key && {
                        backgroundColor: theme.colors.primary + '20'
                      }
                    ]}
                  />
                  {index < roles.length - 1 && <Divider />}
                </View>
              ))}
            </View>
          </Dialog.Content>
          
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  button: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  rolesList: {
    marginBottom: 16,
  },
  roleItem: {
    paddingVertical: 8,
  },
});

export default DemoRoleSwitcher;
