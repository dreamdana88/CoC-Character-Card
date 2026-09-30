export function setCredit(card, fields = {}) {
  let skill = card.skills.find((item) => item?.name === "信用评级");
  if (!skill) {
    skill = { name: "信用评级", specialty: "", base: 0, growth: 0, occupationPoints: 0, interestPoints: 0 };
    card.skills.push(skill);
  }
  Object.assign(skill, {
    name: "信用评级",
    specialty: "",
    base: 0,
    growth: 0,
    occupationPoints: 0,
    interestPoints: 0,
  }, fields);
  return skill;
}

export function minimalCharacter() {
  return {
    schemaVersion: 1,
    ruleset: "coc7",
    id: "card-1",
    ownerDiscordUserId: "100",
    identity: {
      name: "奈洛莉",
      age: 28,
      sex: "女",
      era: "1920s",
      residence: "阿卡姆",
      birthplace: "波士顿",
    },
    characteristics: {
      str: 50,
      con: 60,
      siz: 55,
      dex: 70,
      app: 40,
      int: 75,
      pow: 50,
      edu: 80,
      luck: 60,
    },
    occupation: {
      id: "accountant",
      name: "会计师",
      pointFormula: "EDU_X4",
      creditMin: 30,
      creditMax: 70,
      occupationalSkills: ["会计"],
    },
    skills: [
      {
        name: "会计",
        specialty: "",
        base: 5,
        growth: 0,
        occupationPoints: 40,
        interestPoints: 0,
      },
      {
        name: "克苏鲁神话",
        specialty: "",
        base: 0,
        growth: 0,
        occupationPoints: 0,
        interestPoints: 0,
      },
      {
        name: "信用评级",
        specialty: "",
        base: 0,
        // 30 落在会计师 30–70 内，且不占用职业点或兴趣点。
        growth: 30,
        occupationPoints: 0,
        interestPoints: 0,
      },
    ],
    background: {
      appearance: "",
      beliefs: "",
      significantPeople: "",
      meaningfulLocations: "",
      treasuredPossessions: "",
      traits: "",
      scars: "",
      phobias: "",
      personalHistory: "",
    },
    weapons: [],
    armor: null,
    possessions: { items: [] },
    spells: [],
  };
}
