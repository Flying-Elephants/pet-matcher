import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";
import { useState } from "react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  if (shop && host) {
    return redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function WelcomePage() {
  const { showForm } = useLoaderData<typeof loader>();
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  return (
    <div className={styles.index}>
      <header className={styles.hero}>
        <h1 className={styles.heading}>Personalize the shopping journey for pets.</h1>
        <p className={styles.text}>
          Increase conversions by matching the right products to every pet profile in your store.
        </p>
        
        {!isLoginVisible ? (
          <div className={styles.actions}>
             <button 
              className={styles.primaryButton} 
              onClick={() => setIsLoginVisible(true)}
            >
              Get Started
            </button>
          </div>
        ) : (
          showForm && (
            <div className={styles.formContainer}>
              <Form className={styles.form} method="post" action="/auth/login">
                <label className={styles.label}>
                  <span>Shop domain</span>
                  <input 
                    className={styles.input} 
                    type="text" 
                    name="shop" 
                    placeholder="my-shop-domain.myshopify.com" 
                    autoFocus
                  />
                </label>
                <div className={styles.actions}>
                  <button className={styles.primaryButton} type="submit">
                    Log in
                  </button>
                  <button 
                    className={styles.secondaryButton} 
                    type="button"
                    onClick={() => setIsLoginVisible(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            </div>
          )
        )}
      </header>

      <main className={styles.features}>
        <div className={styles.featureCard}>
          <strong>Pet Profiles</strong>
          <p>Let customers create detailed profiles for their pets to get tailored recommendations.</p>
        </div>
        <div className={styles.featureCard}>
          <strong>Smart Match Rules</strong>
          <p>Define logic-based rules that connect products to pet breeds, ages, and attributes.</p>
        </div>
        <div className={styles.featureCard}>
          <strong>Deep Integration</strong>
          <p>Seamlessly embedded into your Shopify theme with real-time matching badges.</p>
        </div>
      </main>
    </div>
  );
}
