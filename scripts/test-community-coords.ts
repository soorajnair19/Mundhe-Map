import {
  resolveCommunityCoordinates,
  parseMapsCoordinates,
  mapsUrlHasPrecisePin,
} from "../lib/community/coords";

const cases = [
  {
    name: "Hotel Radhakrishna short plus code in Thane",
    input: {
      id: "req-hotel-radhakrishna",
      maps_url: "",
      plus_code: "5WVV+9X",
      locality: "Wagle Estate",
      city: "Thane",
      district: "Thane",
    },
    expectLngNear: 72.97,
  },
  {
    name: "Full pasted plus code with city suffix",
    input: {
      id: "req-hotel-radhakrishna",
      maps_url: "",
      plus_code: "5WVV+9X8M Thane, Maharashtra, India",
      locality: "Wagle Estate",
      city: "Thane",
      district: "Thane",
    },
    expectLngNear: 72.97,
  },
  {
    name: "Google Maps place URL with place pin",
    input: {
      id: "req-test",
      maps_url:
        "https://www.google.com/maps/place/Hotel+Radhakrishna/@19.1934,72.9450,17z/data=!3d19.1934175!4d72.9449492",
      plus_code: null,
      locality: "Wagle Estate",
      city: "Thane",
      district: "Thane",
    },
    expectLngNear: 72.94,
  },
  {
    name: "Short maps.app.goo.gl share link",
    input: {
      id: "req-test-goo-gl",
      maps_url: "https://maps.app.goo.gl/Szbwpyi5fN57tZKj7",
      plus_code: null,
      locality: "Wagle Estate",
      city: "Thane",
      district: "Thane",
    },
    expectLngNear: 72.94,
  },
];

const validationCases = [
  {
    name: "Share link with place pin accepted",
    maps_url:
      "https://www.google.com/maps/place/Hotel/@19.1934,72.9450,17z/data=!3d19.1934175!4d72.9449492",
    expectPrecise: true,
  },
  {
    name: "Short goo.gl share link accepted",
    maps_url: "https://maps.app.goo.gl/Szbwpyi5fN57tZKj7",
    expectPrecise: true,
  },
  {
    name: "Search-style maps URL rejected on submit",
    maps_url:
      "https://www.google.com/maps/search/?api=1&query=Hotel+Radhakrishna+Thane",
    expectPrecise: false,
  },
];

async function main() {
  let failed = 0;
  for (const testCase of cases) {
    const result = await resolveCommunityCoordinates(testCase.input);
    const lngOk =
      Math.abs(result.longitude - testCase.expectLngNear) < 0.05;
    console.log(`\n${testCase.name}`);
    console.log(
      `  -> ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)} plus=${result.plus_code}`,
    );
    console.log(
      `  longitude near ${testCase.expectLngNear}: ${lngOk ? "OK" : "FAIL"}`,
    );
    if (!lngOk) failed += 1;
  }

  for (const testCase of validationCases) {
    const reference = { latitude: 19.2183, longitude: 72.9781 };
    const precise = await mapsUrlHasPrecisePin(testCase.maps_url, reference);
    const ok = precise === testCase.expectPrecise;
    console.log(
      `\n${testCase.name}: ${precise ? "precise" : "not precise"} ${ok ? "OK" : "FAIL"}`,
    );
    if (!ok) failed += 1;
  }

  const badLng = parseMapsCoordinates(
    "https://www.google.com/maps/search/?api=1&query=Hotel+Radhakrishna+Thane",
    { latitude: 19.2183, longitude: 72.9781 },
  );
  console.log("\nSearch-style maps URL without coords");
  console.log(
    `  -> ${badLng ? `${badLng.latitude}, ${badLng.longitude}` : "null (expected)"}`,
  );

  if (failed > 0) {
    console.error(`\n${failed} coordinate test(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll coordinate checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
