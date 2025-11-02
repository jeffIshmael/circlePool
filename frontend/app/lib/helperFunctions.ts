// this function receives an array of addresses and returns an array of addresses in a random order

export const getRandomOrder = (addresses: string[]) => {
  return addresses.sort(() => Math.random() - 0.5);
}