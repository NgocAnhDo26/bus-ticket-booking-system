export const generateSeatCode = (row: number, col: number) => {
  const rowLetter = String.fromCharCode(65 + row);
  const colNumber = String(col + 1).padStart(2, "0");
  return `${rowLetter}${colNumber}`;
};

export const generateNextSeatCode = (
  seats: { seatCode: string }[],
  rowIdx: number, // Was colIndex, now rowIdx determines the letter prefix
) => {
  const prefix = String.fromCharCode(65 + rowIdx);
  let max = 0;
  // Regex to match "A1", "A2", "B1" etc. where A is the prefix
  const regex = new RegExp(`^${prefix}(\\d+)$`);

  for (const seat of seats) {
    const match = seat.seatCode.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
  }

  return `${prefix}${max + 1}`;
};

export const seatKey = (floor: number, row: number, col: number) =>
  `${floor}-${row}-${col}`;

export const createSeatId = () =>
  crypto.randomUUID?.() ??
  `seat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
