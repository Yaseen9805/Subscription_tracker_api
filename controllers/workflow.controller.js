import {createRequire} from 'module';
import Subscription from '../models/subscription.model.js'
import dayjs from 'dayjs';

const require=createRequire(import.meta.url);
const {serve }= require ('@upstash/workflow/express');

const REMINDERS=[7,5,2,1];
export const sendreminders=serve(async(context)=>{
    const {subscriptionId}= context.requestPayload;
    const subscription= await fetchSubscription(context,subscriptionId);

    if(!subscription|| subscription.status!== 'active')return;
     
    const renewaldate=dayjs(subscription.renewaldate);

    if(renewaldate.isBefore(dayjs())){
        console.log(`Renewal date has passed for subscription 
            ${subscriptionId}. stopping workflow`)
            return;
    }
    for(const daysBefore of REMINDERS){
        const reminderdate=renewaldate.subtract(daysBefore,'day')
        if(reminderdate.isAfter(dayjs())){
            await sleepuntilreminder(context,`Reminder ${daysBefore} days before`,reminderdate);
        }
        await triggerreminder(context,`Reminder ${daysBefore} daysbefore`)
    }

});

const fetchSubscription=async (context,subscriptionId)=>{
    return await context.run('get subscription',async ()=>{
        return Subscription.findById(subscriptionId).populate('user','name email')
    })
}
const sleepuntilreminder= async(context,label,date)=>{
    console.log(`sleeping until ${label} reminder at${date}`);
    await context.sleepUntil(label,date.toDate());
}
const triggerreminder=async (context,label)=>{
    return await context.run(label,()=>{
        console.log(`Triggering ${label} reminder`)
    })
}
export default sendreminders;