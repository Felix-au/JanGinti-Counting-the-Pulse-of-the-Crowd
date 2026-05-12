/**
 * Prebuilt scenarios — Rich sample configurations with redundant paths and complex rules.
 */
import { createScenario, createArea, createPath, createRule } from '../core/Scenario.js';

export function getPrebuiltScenarios() {
  return [
    railwayStation(),
    festivalGround(),
    stadiumEvent(),
    airportTerminal(),
  ];
}

function railwayStation() {
  const platform1 = createArea({ name: 'Platform 1', x: 140, y: 160, width: 170, height: 105, monitored: true, currentCount: 320, maxCapacity: 800 });
  const platform2 = createArea({ name: 'Platform 2', x: 140, y: 440, width: 170, height: 105, monitored: true, currentCount: 150, maxCapacity: 800 });
  const ticketHall = createArea({ name: 'Ticket Hall', x: 440, y: 300, width: 180, height: 110, monitored: true, currentCount: 200, maxCapacity: 600 });
  const entrance = createArea({ name: 'Main Entrance', x: 740, y: 160, width: 160, height: 95, monitored: false, currentCount: 80, maxCapacity: 400 });
  const parking = createArea({ name: 'Parking Area', x: 740, y: 440, width: 160, height: 95, monitored: false, currentCount: 50, maxCapacity: 500 });
  const waitingRoom = createArea({ name: 'Waiting Room', x: 440, y: 100, width: 160, height: 90, monitored: true, currentCount: 90, maxCapacity: 300 });
  const footBridge = createArea({ name: 'Foot Overbridge', x: 140, y: 300, width: 150, height: 80, monitored: false, currentCount: 30, maxCapacity: 200 });
  const vendorZone = createArea({ name: 'Vendor Zone', x: 440, y: 510, width: 150, height: 80, monitored: false, currentCount: 60, maxCapacity: 250 });

  const areas = [platform1, platform2, ticketHall, entrance, parking, waitingRoom, footBridge, vendorZone];

  const paths = [
    // Primary paths (open)
    createPath({ fromAreaId: platform1.id, toAreaId: ticketHall.id, name: 'Corridor A', isOpen: true }),
    createPath({ fromAreaId: platform2.id, toAreaId: ticketHall.id, name: 'Corridor B', isOpen: true }),
    createPath({ fromAreaId: ticketHall.id, toAreaId: entrance.id, name: 'Main Exit', isOpen: true }),
    createPath({ fromAreaId: platform1.id, toAreaId: footBridge.id, name: 'P1 to Overbridge', isOpen: true }),
    createPath({ fromAreaId: footBridge.id, toAreaId: platform2.id, name: 'Overbridge to P2', isOpen: true }),
    createPath({ fromAreaId: entrance.id, toAreaId: parking.id, name: 'Walkway', isOpen: true }),
    createPath({ fromAreaId: platform1.id, toAreaId: waitingRoom.id, name: 'P1 Waiting Access', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: waitingRoom.id, toAreaId: ticketHall.id, name: 'Waiting to Hall', isOpen: true }),
    // Redundant / overflow paths (closed by default — opened by rules)
    createPath({ fromAreaId: ticketHall.id, toAreaId: parking.id, name: 'Side Exit', isOpen: false }),
    createPath({ fromAreaId: platform1.id, toAreaId: entrance.id, name: 'Emergency Bypass P1', isOpen: false }),
    createPath({ fromAreaId: platform2.id, toAreaId: parking.id, name: 'Emergency Bypass P2', isOpen: false }),
    createPath({ fromAreaId: platform2.id, toAreaId: vendorZone.id, name: 'P2 to Vendors', isOpen: false }),
    createPath({ fromAreaId: vendorZone.id, toAreaId: parking.id, name: 'Vendor Side Exit', isOpen: false }),
    createPath({ fromAreaId: footBridge.id, toAreaId: ticketHall.id, name: 'Overbridge Direct', isOpen: false }),
    createPath({ fromAreaId: waitingRoom.id, toAreaId: entrance.id, name: 'Waiting Room Exit', isOpen: false }),
  ];

  const rules = [
    createRule({
      areaId: ticketHall.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Ticket Hall: at least 1 exit must always be open',
    }),
    createRule({
      areaId: platform1.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 400, minPaths: 2, direction: 'outgoing' },
        { threshold: 600, minPaths: 3, direction: 'outgoing' },
        { threshold: 750, minPaths: 4, direction: 'outgoing' },
      ],
      description: 'Platform 1: ≥400→2 exits, ≥600→3, ≥750→4 exits',
    }),
    createRule({
      areaId: platform2.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 400, minPaths: 2, direction: 'outgoing' },
        { threshold: 600, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'Platform 2: ≥400→2 exits, ≥600→3 exits',
    }),
    createRule({
      areaId: platform2.id, type: 'MIN_PATHS', direction: 'both', minPaths: 1,
      description: 'Platform 2: at least 1 path open at all times',
    }),
    createRule({
      areaId: ticketHall.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 300, minPaths: 2, direction: 'outgoing' },
        { threshold: 500, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'Ticket Hall: ≥300→2 exits, ≥500→open all exits',
    }),
    createRule({
      areaId: waitingRoom.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 200, minPaths: 2, direction: 'outgoing' },
      ],
      description: 'Waiting Room: ≥200→open emergency exit route',
    }),
    createRule({
      areaId: entrance.id, type: 'MIN_PATHS', direction: 'incoming', minPaths: 1,
      description: 'Main Entrance: at least 1 incoming path always open',
    }),
  ];

  return createScenario({
    name: '🚂 Railway Station',
    description: 'A busy railway station with 2 platforms, ticket hall, waiting room, foot overbridge, vendor zone, and multiple emergency bypass routes.',
    areas, paths, rules,
  });
}

function festivalGround() {
  const mainStage = createArea({ name: 'Main Stage', x: 400, y: 120, width: 200, height: 115, monitored: true, currentCount: 600, maxCapacity: 2000 });
  const foodCourt = createArea({ name: 'Food Court', x: 120, y: 300, width: 165, height: 100, monitored: true, currentCount: 250, maxCapacity: 500 });
  const entryGate = createArea({ name: 'Entry Gate', x: 700, y: 250, width: 150, height: 95, monitored: true, currentCount: 100, maxCapacity: 300 });
  const emergencyExit = createArea({ name: 'Emergency Exit', x: 400, y: 520, width: 165, height: 95, monitored: false, currentCount: 0, maxCapacity: 400 });
  const vipZone = createArea({ name: 'VIP Zone', x: 700, y: 80, width: 140, height: 85, monitored: false, currentCount: 50, maxCapacity: 150 });
  const secondStage = createArea({ name: 'Side Stage', x: 120, y: 120, width: 155, height: 90, monitored: true, currentCount: 180, maxCapacity: 800 });
  const medicalTent = createArea({ name: 'Medical Tent', x: 120, y: 500, width: 145, height: 80, monitored: false, currentCount: 10, maxCapacity: 80 });
  const parkingLot = createArea({ name: 'Parking Lot', x: 700, y: 480, width: 150, height: 85, monitored: false, currentCount: 40, maxCapacity: 600 });

  const areas = [mainStage, foodCourt, entryGate, emergencyExit, vipZone, secondStage, medicalTent, parkingLot];

  const paths = [
    // Primary (open)
    createPath({ fromAreaId: entryGate.id, toAreaId: mainStage.id, name: 'Main Path', isOpen: true }),
    createPath({ fromAreaId: mainStage.id, toAreaId: foodCourt.id, name: 'Food Lane', isOpen: true }),
    createPath({ fromAreaId: entryGate.id, toAreaId: vipZone.id, name: 'VIP Access', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: vipZone.id, toAreaId: mainStage.id, name: 'VIP Viewing', isOpen: true }),
    createPath({ fromAreaId: secondStage.id, toAreaId: foodCourt.id, name: 'Stage 2 to Food', isOpen: true }),
    createPath({ fromAreaId: secondStage.id, toAreaId: mainStage.id, name: 'Inter-Stage', isOpen: true }),
    createPath({ fromAreaId: foodCourt.id, toAreaId: medicalTent.id, name: 'Medical Access', isOpen: true }),
    // Redundant / emergency (closed by default)
    createPath({ fromAreaId: mainStage.id, toAreaId: emergencyExit.id, name: 'Emergency Route A', isOpen: false }),
    createPath({ fromAreaId: foodCourt.id, toAreaId: emergencyExit.id, name: 'Emergency Route B', isOpen: false }),
    createPath({ fromAreaId: secondStage.id, toAreaId: emergencyExit.id, name: 'Emergency Route C', isOpen: false }),
    createPath({ fromAreaId: mainStage.id, toAreaId: parkingLot.id, name: 'Overflow Exit', isOpen: false }),
    createPath({ fromAreaId: entryGate.id, toAreaId: parkingLot.id, name: 'Gate to Parking', isOpen: false }),
    createPath({ fromAreaId: emergencyExit.id, toAreaId: parkingLot.id, name: 'Evac to Parking', isOpen: false }),
    createPath({ fromAreaId: emergencyExit.id, toAreaId: medicalTent.id, name: 'Evac Medical', isOpen: false }),
    createPath({ fromAreaId: mainStage.id, toAreaId: secondStage.id, name: 'Crowd Diversion', isOpen: false }),
  ];

  const rules = [
    createRule({
      areaId: mainStage.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 800, minPaths: 2, direction: 'outgoing' },
        { threshold: 1200, minPaths: 3, direction: 'outgoing' },
        { threshold: 1500, minPaths: 4, direction: 'outgoing' },
        { threshold: 1800, minPaths: 5, direction: 'outgoing' },
      ],
      description: 'Main Stage: progressive emergency exit opening at 800/1200/1500/1800',
    }),
    createRule({
      areaId: mainStage.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Main Stage: always keep at least 1 exit open',
    }),
    createRule({
      areaId: secondStage.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 500, minPaths: 3, direction: 'outgoing' },
        { threshold: 700, minPaths: 4, direction: 'outgoing' },
      ],
      description: 'Side Stage: ≥500→3 exits, ≥700→open emergency route',
    }),
    createRule({
      areaId: foodCourt.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 350, minPaths: 2, direction: 'outgoing' },
        { threshold: 450, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'Food Court: open additional exits when crowded',
    }),
    createRule({
      areaId: foodCourt.id, type: 'MIN_PATHS', direction: 'incoming', minPaths: 1,
      description: 'Food Court: always accessible from at least 1 area',
    }),
    createRule({
      areaId: entryGate.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 200, minPaths: 2, direction: 'outgoing' },
      ],
      description: 'Entry Gate: ≥200→open overflow parking route',
    }),
    createRule({
      areaId: emergencyExit.id, type: 'MIN_PATHS', direction: 'incoming', minPaths: 1,
      description: 'Emergency Exit: always reachable from at least 1 area',
    }),
  ];

  return createScenario({
    name: '🎪 Festival Ground',
    description: 'Large outdoor festival with main & side stages, food court, VIP, medical tent, emergency exits, and parking. Complex crowd surge management.',
    areas, paths, rules,
  });
}

function stadiumEvent() {
  const northStand = createArea({ name: 'North Stand', x: 350, y: 80, width: 175, height: 100, monitored: true, currentCount: 400, maxCapacity: 1500 });
  const southStand = createArea({ name: 'South Stand', x: 350, y: 530, width: 175, height: 100, monitored: true, currentCount: 350, maxCapacity: 1500 });
  const eastStand = createArea({ name: 'East Stand', x: 620, y: 300, width: 160, height: 100, monitored: true, currentCount: 280, maxCapacity: 1200 });
  const concourse = createArea({ name: 'Concourse', x: 350, y: 300, width: 190, height: 100, monitored: true, currentCount: 200, maxCapacity: 800 });
  const gateA = createArea({ name: 'Gate A (West)', x: 80, y: 200, width: 140, height: 85, monitored: false, currentCount: 80, maxCapacity: 300 });
  const gateB = createArea({ name: 'Gate B (East)', x: 850, y: 300, width: 140, height: 85, monitored: false, currentCount: 60, maxCapacity: 300 });
  const gateC = createArea({ name: 'Gate C (South)', x: 80, y: 430, width: 140, height: 85, monitored: false, currentCount: 40, maxCapacity: 300 });
  const vipArea = createArea({ name: 'VIP Lounge', x: 620, y: 80, width: 140, height: 80, monitored: false, currentCount: 30, maxCapacity: 100 });
  const pressBooth = createArea({ name: 'Press Box', x: 620, y: 530, width: 140, height: 80, monitored: false, currentCount: 20, maxCapacity: 60 });

  const areas = [northStand, southStand, eastStand, concourse, gateA, gateB, gateC, vipArea, pressBooth];

  const paths = [
    // Primary (open)
    createPath({ fromAreaId: gateA.id, toAreaId: concourse.id, name: 'Gate A Entry', isOpen: true }),
    createPath({ fromAreaId: gateB.id, toAreaId: eastStand.id, name: 'Gate B Entry', isOpen: true }),
    createPath({ fromAreaId: concourse.id, toAreaId: northStand.id, name: 'North Tunnel', isOpen: true }),
    createPath({ fromAreaId: concourse.id, toAreaId: southStand.id, name: 'South Tunnel', isOpen: true }),
    createPath({ fromAreaId: concourse.id, toAreaId: eastStand.id, name: 'East Tunnel', isOpen: true }),
    createPath({ fromAreaId: northStand.id, toAreaId: vipArea.id, name: 'VIP Access', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: southStand.id, toAreaId: pressBooth.id, name: 'Press Access', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: gateC.id, toAreaId: concourse.id, name: 'Gate C Entry', isOpen: true }),
    // Redundant / emergency (closed)
    createPath({ fromAreaId: gateA.id, toAreaId: northStand.id, name: 'Gate A Direct North', isOpen: false }),
    createPath({ fromAreaId: gateA.id, toAreaId: southStand.id, name: 'Gate A Direct South', isOpen: false }),
    createPath({ fromAreaId: gateC.id, toAreaId: southStand.id, name: 'Gate C Direct South', isOpen: false }),
    createPath({ fromAreaId: gateB.id, toAreaId: concourse.id, name: 'Gate B Overflow', isOpen: false }),
    createPath({ fromAreaId: northStand.id, toAreaId: southStand.id, name: 'North-South Bypass', isOpen: false }),
    createPath({ fromAreaId: eastStand.id, toAreaId: gateA.id, name: 'East Emergency Exit', isOpen: false }),
    createPath({ fromAreaId: northStand.id, toAreaId: gateC.id, name: 'North Emergency Evac', isOpen: false }),
    createPath({ fromAreaId: vipArea.id, toAreaId: gateB.id, name: 'VIP Emergency Exit', isOpen: false }),
  ];

  const rules = [
    createRule({
      areaId: concourse.id, type: 'THRESHOLD', direction: 'incoming',
      conditions: [
        { threshold: 400, minPaths: 3, direction: 'incoming' },
        { threshold: 600, minPaths: 4, direction: 'incoming' },
        { threshold: 750, minPaths: 5, direction: 'incoming' },
      ],
      description: 'Concourse: open additional gates at 400/600/750',
    }),
    createRule({
      areaId: concourse.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 2,
      description: 'Concourse: always keep at least 2 exits to stands',
    }),
    createRule({
      areaId: northStand.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 800, minPaths: 2, direction: 'outgoing' },
        { threshold: 1200, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'North Stand: ≥800→2 exits, ≥1200→open emergency evac',
    }),
    createRule({
      areaId: northStand.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'North Stand: always keep at least 1 exit open',
    }),
    createRule({
      areaId: southStand.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 800, minPaths: 2, direction: 'outgoing' },
        { threshold: 1200, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'South Stand: ≥800→2 exits, ≥1200→3 exits',
    }),
    createRule({
      areaId: eastStand.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 600, minPaths: 2, direction: 'outgoing' },
        { threshold: 1000, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'East Stand: ≥600→2 exits, ≥1000→open emergency exit',
    }),
    createRule({
      areaId: gateA.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Gate A: always keep at least 1 path into stadium',
    }),
    createRule({
      areaId: gateB.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Gate B: always keep at least 1 path into stadium',
    }),
  ];

  return createScenario({
    name: '🏟️ Stadium Event',
    description: 'Large stadium with north/south/east stands, concourse ring, 3 gates, VIP lounge, and press box. Multiple emergency evacuation routes.',
    areas, paths, rules,
  });
}

function airportTerminal() {
  const checkin = createArea({ name: 'Check-in Hall', x: 100, y: 200, width: 175, height: 105, monitored: true, currentCount: 180, maxCapacity: 500 });
  const security = createArea({ name: 'Security Check', x: 340, y: 120, width: 160, height: 95, monitored: true, currentCount: 120, maxCapacity: 300 });
  const gateLounge = createArea({ name: 'Gate Lounge', x: 600, y: 120, width: 175, height: 95, monitored: true, currentCount: 250, maxCapacity: 600 });
  const baggage = createArea({ name: 'Baggage Claim', x: 340, y: 400, width: 175, height: 95, monitored: true, currentCount: 90, maxCapacity: 400 });
  const arrivals = createArea({ name: 'Arrivals Hall', x: 600, y: 400, width: 165, height: 95, monitored: false, currentCount: 60, maxCapacity: 300 });
  const dutyFree = createArea({ name: 'Duty Free', x: 600, y: 260, width: 150, height: 80, monitored: false, currentCount: 70, maxCapacity: 200 });
  const immigration = createArea({ name: 'Immigration', x: 340, y: 260, width: 155, height: 80, monitored: true, currentCount: 45, maxCapacity: 200 });
  const curbside = createArea({ name: 'Curbside Drop', x: 100, y: 400, width: 155, height: 85, monitored: false, currentCount: 30, maxCapacity: 250 });
  const transitLounge = createArea({ name: 'Transit Lounge', x: 840, y: 200, width: 150, height: 85, monitored: false, currentCount: 55, maxCapacity: 180 });

  const areas = [checkin, security, gateLounge, baggage, arrivals, dutyFree, immigration, curbside, transitLounge];

  const paths = [
    // Primary departures flow (open)
    createPath({ fromAreaId: checkin.id, toAreaId: security.id, name: 'To Security', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: security.id, toAreaId: gateLounge.id, name: 'To Gates', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: security.id, toAreaId: dutyFree.id, name: 'To Duty Free', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: dutyFree.id, toAreaId: gateLounge.id, name: 'Duty Free to Gates', isOpen: true }),
    createPath({ fromAreaId: gateLounge.id, toAreaId: transitLounge.id, name: 'To Transit', isOpen: true }),
    // Primary arrivals flow (open)
    createPath({ fromAreaId: gateLounge.id, toAreaId: immigration.id, name: 'Arrival Immigration', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: immigration.id, toAreaId: baggage.id, name: 'To Baggage', isOpen: true, bidirectional: false }),
    createPath({ fromAreaId: baggage.id, toAreaId: arrivals.id, name: 'To Arrivals', isOpen: true }),
    createPath({ fromAreaId: curbside.id, toAreaId: checkin.id, name: 'Curbside Entry', isOpen: true, bidirectional: false }),
    // Redundant / overflow (closed)
    createPath({ fromAreaId: checkin.id, toAreaId: immigration.id, name: 'Staff Corridor', isOpen: false }),
    createPath({ fromAreaId: checkin.id, toAreaId: baggage.id, name: 'Service Tunnel', isOpen: false }),
    createPath({ fromAreaId: security.id, toAreaId: immigration.id, name: 'Security Bypass', isOpen: false }),
    createPath({ fromAreaId: gateLounge.id, toAreaId: baggage.id, name: 'Direct Deboarding', isOpen: false }),
    createPath({ fromAreaId: arrivals.id, toAreaId: curbside.id, name: 'Arrivals to Curbside', isOpen: false }),
    createPath({ fromAreaId: transitLounge.id, toAreaId: dutyFree.id, name: 'Transit Shopping', isOpen: false }),
    createPath({ fromAreaId: immigration.id, toAreaId: arrivals.id, name: 'Immigration Express', isOpen: false }),
  ];

  const rules = [
    createRule({
      areaId: security.id, type: 'THRESHOLD', direction: 'both',
      conditions: [
        { threshold: 150, minPaths: 2, direction: 'outgoing' },
        { threshold: 250, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'Security: ≥150→open bypass, ≥250→open all routes',
    }),
    createRule({
      areaId: security.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Security: always keep at least 1 path to gates',
    }),
    createRule({
      areaId: gateLounge.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 300, minPaths: 2, direction: 'outgoing' },
        { threshold: 500, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'Gate Lounge: ≥300→2 exits, ≥500→open direct deboarding',
    }),
    createRule({
      areaId: gateLounge.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Gate Lounge: always maintain at least 1 exit',
    }),
    createRule({
      areaId: immigration.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 120, minPaths: 2, direction: 'outgoing' },
      ],
      description: 'Immigration: ≥120→open express lane to arrivals',
    }),
    createRule({
      areaId: checkin.id, type: 'THRESHOLD', direction: 'outgoing',
      conditions: [
        { threshold: 300, minPaths: 2, direction: 'outgoing' },
        { threshold: 450, minPaths: 3, direction: 'outgoing' },
      ],
      description: 'Check-in: ≥300→open staff corridor, ≥450→service tunnel',
    }),
    createRule({
      areaId: baggage.id, type: 'MIN_PATHS', direction: 'outgoing', minPaths: 1,
      description: 'Baggage Claim: always keep at least 1 exit open',
    }),
    createRule({
      areaId: baggage.id, type: 'THRESHOLD', direction: 'incoming',
      conditions: [
        { threshold: 250, minPaths: 2, direction: 'incoming' },
      ],
      description: 'Baggage Claim: ≥250→open overflow arrival paths',
    }),
  ];

  return createScenario({
    name: '✈️ Airport Terminal',
    description: 'Full airport terminal with check-in, security, duty free, gate lounge, transit, immigration, baggage claim, arrivals, and curbside. Complex departure & arrival flows.',
    areas, paths, rules,
  });
}
