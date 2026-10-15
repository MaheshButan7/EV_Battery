import React from 'react';
import SiteLocationMap from '../components/SiteLocationMap';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';

export default function FleetMap() {
  const { accessibleSites, selectSite } = useDemoData();

  return (
    <PageFrame
      title="Site Map"
      description="Fleet-wide geographic view of site operating state, communications, availability and asset health."
    >
      <SiteLocationMap sites={accessibleSites} onSelectSite={selectSite} />
    </PageFrame>
  );
}
