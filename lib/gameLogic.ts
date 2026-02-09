export const getRank = (xp: number) => {
    if (xp >= 5000) return "S-RANK";
    if (xp >= 2500) return "A-RANK";
    if (xp >= 1000) return "B-RANK";
    if (xp >= 400) return "C-RANK";
    if (xp >= 150) return "D-RANK";
    if (xp >= 50) return "E-RANK";
    return "F-RANK";
};

export const getNextRankXP = (xp: number) => {
    if (xp >= 5000) return 10000; // Max level
    if (xp >= 2500) return 5000;
    if (xp >= 1000) return 2500;
    if (xp >= 400) return 1000;
    if (xp >= 150) return 400;
    if (xp >= 50) return 150;
    return 50;
};