/**
 * Lightweight local faker — drop-in replacement for @faker-js/faker.
 * No npm install required. Covers exactly the API used in testData.js.
 */

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const FIRST_NAMES = [
    "James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda",
    "William","Barbara","David","Elizabeth","Richard","Susan","Joseph","Jessica",
    "Thomas","Sarah","Charles","Karen","Christopher","Lisa","Daniel","Nancy",
    "Matthew","Betty","Anthony","Margaret","Mark","Sandra","Paul","Ashley",
    "Andrew","Dorothy","Joshua","Kimberly","Kenneth","Emily","Kevin","Donna",
];
const LAST_NAMES = [
    "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
    "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
    "Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson",
    "White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker",
    "Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
];
const LOREM_WORDS = [
    "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit",
    "sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore",
    "magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation",
    "ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat","duis",
    "aute","irure","in","reprehenderit","voluptate","velit","esse","cillum",
    "fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non",
    "proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id",
    "est","laborum","praesent","viverra","malesuada","fames","turpis","egestas",
];
const EMAIL_DOMAINS = ["example.com", "test.org", "demo.net", "sample.io", "fake.dev"];

const lorem = {
    word: () => pick(LOREM_WORDS),

    words: (count = 3) =>
        Array.from({ length: count }, () => pick(LOREM_WORDS)).join(" "),

    sentence: () => {
        const words = Array.from({ length: rand(6, 14) }, () => pick(LOREM_WORDS));
        words[0] = words[0][0].toUpperCase() + words[0].slice(1);
        return words.join(" ") + ".";
    },

    paragraphs: (count = 3) =>
        Array.from({ length: count }, () => {
            const sentences = Array.from({ length: rand(3, 6) }, () => {
                const words = Array.from({ length: rand(6, 14) }, () => pick(LOREM_WORDS));
                words[0] = words[0][0].toUpperCase() + words[0].slice(1);
                return words.join(" ") + ".";
            });
            return sentences.join(" ");
        }).join("\n\n"),
};

export const faker = {
    person: {
        fullName:  () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        firstName: () => pick(FIRST_NAMES),
    },
    internet: {
        email: () =>
            `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}${rand(100, 9999)}@${pick(EMAIL_DOMAINS)}`,
    },
    lorem,
};
