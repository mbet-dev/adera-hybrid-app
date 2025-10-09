import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { AppBar, Card, ParcelCard, useTheme } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';

const ParcelHistory = ({ navigation }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    setLoading(true);
    
    // TODO: Load from Supabase
    setTimeout(() => {
      setParcels([
        {
          id: '1',
          tracking_id: 'AD001234',
          status: 6,
          recipient_name: 'John Doe',
          pickup_location: { name: 'Bole Atlas' },
          delivery_location: { name: 'Gerji' },
          created_at: '2025-01-09T10:00:00.000Z'
        },
        {
          id: '2',
          tracking_id: 'AD001235',
          status: 5,
          recipient_name: 'Mary Smith',
          pickup_location: { name: 'Piazza' },
          delivery_location: { name: 'Kazanchis' },
          created_at: '2025-01-08T15:30:00.000Z'
        },
        {
          id: '3',
          tracking_id: 'AD001236',
          status: 2,
          recipient_name: 'Ahmed Ali',
          pickup_location: { name: 'Merkato' },
          delivery_location: { name: 'CMC' },
          created_at: '2025-01-07T09:15:00.000Z'
        }
      ]);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParcels();
  };

  const handleTrackParcel = (parcel) => {
    navigation?.navigate?.('track', { trackingId: parcel.tracking_id });
  };

  const filteredParcels = parcels.filter(parcel =>
    parcel.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parcel.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppBar 
        title="Parcel History"
        onBack={() => navigation?.goBack?.()}
      />
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by tracking ID or recipient"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {filteredParcels.length > 0 ? (
          filteredParcels.map(parcel => (
            <ParcelCard
              key={parcel.id}
              parcel={parcel}
              onTrack={handleTrackParcel}
              style={styles.parcelCard}
            />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons 
                name="archive-outline" 
                size={48} 
                color={theme.colors.gray[400]} 
              />
              <Text 
                variant="bodyLarge" 
                style={[styles.emptyText, { color: theme.colors.text.secondary }]}
              >
                {searchQuery ? 'No parcels found' : 'No parcel history yet'}
              </Text>
              <Text 
                variant="bodyMedium" 
                style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}
              >
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Your sent parcels will appear here'
                }
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  parcelCard: {
    marginBottom: 8,
  },
  emptyCard: {
    padding: 40,
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ParcelHistory;
