import get from 'lodash-es/get';
import { waitingTime } from '../config.json';

export const readFromStorage = async id => {
    return JSON.parse(await localStorage.getItem(id));
};

export const writeToStorage = async (item, role) => {
    if (item.type === 'proposal' && role === 'SR') {
        await removeFromStorage(item.id);
        await localStorage.setItem(`${item.id}#${item.partner}`, JSON.stringify(item));
    } else {
        await localStorage.setItem(item.id, JSON.stringify(item));
    }
};

export const removeProposals = async id => {
    const requestId = id.split('#')[0];
    const allKeys = await Object.keys(localStorage);
    allKeys.forEach(async key => {
        if (key.split('#')[0] === requestId) {
            await removeFromStorage(key);
        }
    });
};

export const removeFromStorage = async item => {
    await localStorage.removeItem(item);
};

export const getByType = async type => {
    const allItems = await Object.values(localStorage);
    const itemsOfType = allItems.reduce((accumulator, item) => {
        const json = JSON.parse(item);
        if (get(json, 'type') === type) {
          accumulator.push(json);
        }
        return accumulator
    }, []);
    return itemsOfType;
}

export const removeExpired = async type => {
    if (type === 'callForProposal' || type === 'proposal') {
        const allItems = await getByType(type);
        const timeInThePast = new Date().getTime() - (waitingTime * 60 * 1000);
        const expiredItems = allItems.filter(({ replyBy }) => replyBy < timeInThePast);
        console.log('expiredItems', expiredItems);
        expiredItems.forEach(async item => await removeFromStorage(item.id));
        console.log('after cleanup', localStorage);
    }
}

/*

Service Requesrer 
* Awaiting proposal - messageType: "callForProposal"
* Proposal received - messageType: "proposal"
* Awaiting fulfilment - messageType: "acceptProposal"
* Awaiting payment - messageType: "informConfirm"
* Completed - messageType: "informPayment"

For Service Provider we can have items like:
* Received requests - messageType: "callForProposal"
* Proposal sent - messageType: "proposal"
* Awaiting fulfilment - messageType: "acceptProposal"
* Awaiting payment - messageType: "informConfirm"
* Completed - messageType: "informPayment"

*/