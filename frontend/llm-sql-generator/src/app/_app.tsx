import "../styles/globals.css"; // ✅ This is now correct

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

