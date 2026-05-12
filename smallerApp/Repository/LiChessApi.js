//https://lichess.org/api#description/introduction
const fetchFromMastersDB = async () => {
    const url = "https://explorer.lichess.org/masters";

}

const fetchLichessEval = async (fen) => {
    const res = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`);

    const data = await res.json();
    console.log('Json response for lichess eval: ', data);
    return data;
}

const fetchMasterDb = async (fen) => {
    const rest = fetch('https://explorer.lichess.org/masters', {
        headers: {
        }
    })
    const data = await res.json();
    console.log('Json response for master db: ', data);
    return data;
}