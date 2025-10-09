import React, { useState } from 'react';
import { BottomNavigation } from '@adera/ui';

// Import Partner screens
import PartnerDashboard from '../screens/partner/PartnerDashboard';
import ScanQR from '../screens/partner/ScanQR';
import ParcelManagement from '../screens/partner/ParcelManagement';
import Earnings from '../screens/partner/Earnings';
import PartnerProfile from '../screens/partner/PartnerProfile';

const PartnerNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'scan', title: 'Scan QR', focusedIcon: 'qr-code', unfocusedIcon: 'qr-code-outline' },
    { key: 'parcels', title: 'Parcels', focusedIcon: 'package-variant', unfocusedIcon: 'package-variant-closed' },
    { key: 'earnings', title: 'Earnings', focusedIcon: 'cash', unfocusedIcon: 'cash-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'person', unfocusedIcon: 'person-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: PartnerDashboard,
    scan: ScanQR,
    parcels: ParcelManagement,
    earnings: Earnings,
    profile: PartnerProfile,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default PartnerNavigator;
