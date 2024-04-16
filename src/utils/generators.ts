export function generateCustomID() {
    // Generate a random number between 0 and 1,000,000
    const randomNumber = Math.floor(Math.random() * 1000000);

    // Convert the number to a string in hexadecimal format
    return  randomNumber.toString(16);

}