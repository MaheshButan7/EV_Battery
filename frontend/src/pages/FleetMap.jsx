import React from 'react';
import SiteLocationMap from '../components/SiteLocationMap';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';

export default function FleetMap() {
  const { selectedSite } = useDemoData();
  const sites = selectedSite ? [selectedSite] : [];

  return (
    <PageFrame
      title="Site Map"
      description="Geographic view of BESS sites, communications state, availability and asset health."
    >
      <SiteLocationMap sites={sites} />
    </PageFrame>
  );
}
