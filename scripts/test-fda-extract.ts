import { extractEstablishmentName } from "../lib/ingest/extract";

const cases: { title: string; expect: string; kind?: string }[] = [
  {
    title:
      "Mumbai's Tewari Bros. Mithaiwala's FSSAI licence suspended after man claims he found stapler pin",
    expect: "Tewari Bros. Mithaiwala",
  },
  {
    title:
      "Chhatrapati Sambhajinagar: Hotel Amarpreet’s Licence Suspended After FDA Finds Safety Lapses",
    expect: "Hotel Amarpreet",
  },
  {
    title:
      "Mumbai’s famous Poornima Restaurant moves HC against FDA, says got ‘official communication’",
    expect: "Poornima Restaurant",
  },
  {
    title:
      "FDA suspends licences of 6 Mumbai hotels, food establishments over safety violations",
    expect: "Multiple Mumbai hotels",
  },
  {
    title:
      "Raided, shut over food safety violations, 3 famous Mumbai restaurants to reopen",
    expect: "Multiple Mumbai restaurants",
  },
  {
    title:
      "Blinkit’s Mumbai Facility Licence Suspended After FDA Finds Cockroach Infestation",
    expect: "Blinkit",
  },
  {
    title:
      "Pune's iconic Camp Burger King sealed as Maharashtra FDA widens food safety drive",
    expect: "Burger King",
  },
  {
    title: "3 Mumbai Domino’s licences suspended after hygiene inspection",
    expect: "Domino's Pizza",
  },
  {
    title:
      "Expired Frooti and Appy Fizz seized in Mumbai warehouse raid: Tukaram Mundhe-led FDA",
    expect: "Parle Agro",
  },
  {
    title: 'FDA suspends licence of "Hotel Sagar" in Nashik after hygiene raid',
    expect: "Hotel Sagar",
  },
  {
    title:
      "Pune Sweet Shop’s Licence Suspended Despite 98% Score, Bombay HC Orders FDA To Pay",
    expect: "Pune Sweet Shop",
  },
  {
    title:
      "Bombay High Court Orders ₹5 Lakh Compensation To Pune Sweets Shop Over FDA Licence",
    expect: "Pune Sweets Shop",
  },
  {
    title:
      "'Torturing citizens': Bombay high court directs Maharashtra FDA to pay Rs 5 lakh",
    expect: "Unnamed establishment",
  },
];

let failed = 0;
for (const test of cases) {
  const result = extractEstablishmentName(test.title);
  const ok = result.name === test.expect;
  if (!ok) {
    failed += 1;
    console.error(
      `FAIL: ${test.title}\n  expected: ${test.expect}\n  got:      ${result.name} (${result.kind})`,
    );
  } else {
    console.log(`ok  ${result.name}`);
  }
}

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\n${cases.length} tests passed`);
