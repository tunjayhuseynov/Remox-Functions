import { newKitFromWeb3 } from "@celo/contractkit";
import { firestore } from "firebase-admin";
import Gelato from '../abi/Gelato';
import Web3 from "web3";

const PK = process.env.PK;
const PA = process.env.PA;

// a functoin to check if the task is ready to be completed
export const checker = async () => {
    if(!PK || !PA) throw new Error("PK or PA is not defined");
    const web3 = new Web3("https://forno.celo.org")
    const kit = newKitFromWeb3(web3);
    kit.addAccount(PK);
    kit.defaultAccount = PA

    const querySnapshot = await firestore().collection("accounts").where("blockchain", "==", "celo").get();
    let addresses: string[] = []
    querySnapshot.forEach((doc) => {
        const address = doc.data().address;
        addresses = addresses.concat(address);
    });
    console.log("All Addresses: ", addresses)
    const contract = new kit.web3.eth.Contract(Gelato as any, "0x88FAcCc7D0C4148A73D2cC626e8192F4ba95F1C7")

    for (let index = 0; index < addresses.length; index++) {
        const address = addresses[index];
        console.log("Address: ", address)
        try {
            const tx = await contract.methods.getTaskIdsByUser(address);
            const tasks = await tx.call();
            console.log("Tasks: ", tasks)
            for (let q = 0; q < tasks.length; q++) {
                const task = tasks[q];
                console.log("Task Id: ", task)
                try {
                    const tx = await contract.methods.exec(task, 0, "0xB01a87B806EE0f5233d7c6559d7FB6d39Ad0046d", false);
                    await tx.send({
                        from: kit.defaultAccount,
                        gasPrice: kit.web3.utils.toWei("0.5", 'Gwei'),
                        gas: 1000000
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

}


