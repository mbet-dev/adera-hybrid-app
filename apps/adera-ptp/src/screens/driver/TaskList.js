import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge } from '@adera/ui';

const TaskList = ({ navigation }) => {
  const tasks = [
    { id: '1', type: 'pickup', tracking_id: 'AD001234', location: 'Bole Atlas', time: '10:30 AM', status: 'pending' },
    { id: '2', type: 'delivery', tracking_id: 'AD001235', location: 'Gerji', time: '11:00 AM', status: 'pending' },
    { id: '3', type: 'pickup', tracking_id: 'AD001236', location: 'Piazza', time: '2:00 PM', status: 'pending' },
  ];

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Task List" />
      
      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>Today's Tasks</Text>
        
        {tasks.map(task => (
          <Card key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text variant="titleMedium">
                {task.type === 'pickup' ? '📦 Pickup' : '🏠 Delivery'} #{task.tracking_id}
              </Text>
              <Text variant="bodySmall" style={styles.taskTime}>{task.time}</Text>
            </View>
            <Text variant="bodyMedium" style={styles.taskLocation}>
              📍 {task.location}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  title: { fontWeight: 'bold', marginBottom: 16 },
  taskCard: { padding: 16, marginBottom: 8 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskTime: { color: '#666' },
  taskLocation: { marginTop: 4 },
});

export default TaskList;
