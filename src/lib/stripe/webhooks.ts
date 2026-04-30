import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SubscriptionStatus } from "@/types";

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const uid = session.metadata?.uid;
  if (!uid) {
    console.error("No uid found in checkout session metadata");
    return;
  }

  await getAdminDb().collection("users").doc(uid).update({
    stripeCustomerId: session.customer as string,
    subscriptionStatus: "active" as SubscriptionStatus,
    subscriptionPriceId: session.metadata?.priceId ?? null,
    updatedAt: new Date(),
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  const customerId = subscription.customer as string;

  const usersSnapshot = await getAdminDb()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  await userDoc.ref.update({
    subscriptionStatus: subscription.status as SubscriptionStatus,
    updatedAt: new Date(),
  });
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  const usersSnapshot = await getAdminDb()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) return;

  await usersSnapshot.docs[0].ref.update({
    subscriptionStatus: "active" as SubscriptionStatus,
    updatedAt: new Date(),
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  const customerId = subscription.customer as string;

  const usersSnapshot = await getAdminDb()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  await userDoc.ref.update({
    subscriptionStatus: "inactive" as SubscriptionStatus,
    updatedAt: new Date(),
  });
}
