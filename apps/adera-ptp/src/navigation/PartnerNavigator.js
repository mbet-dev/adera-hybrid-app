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
    { key: 'scan', title: 'Scan QR', focusedIcon: 'qrcode-scan', unfocusedIcon: 'qrcode-scan' },
    { key: 'parcels', title: 'Parcels', focusedIcon: 'package-variant', unfocusedIcon: 'package-variant-closed' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account-circle', unfocusedIcon: 'account-circle-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: PartnerDashboard,
    scan: ScanQR,
    parcels: ParcelManagement,
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
