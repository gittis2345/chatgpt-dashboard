import Head from 'next/head';

export default function Layout({ children, title = "ChatGPT Dashboard" }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Dynamic ChatGPT Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="dashboard-container">
        {children}
      </div>
    </>
  );
}
