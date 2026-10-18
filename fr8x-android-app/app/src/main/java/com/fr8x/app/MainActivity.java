package com.fr8x.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;
import android.webkit.WebResourceResponse;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    // Primary Production Endpoint for Live Enterprise Freight Workspace
    public static final String PRODUCTION_URL = "https://con.fr8x.in";
    // Local development fallback
    public static final String LOCAL_DEV_URL = "http://10.0.2.2:3000";
    // Offline bundled workspace fallback (embedded in APK assets)
    public static final String OFFLINE_URL = "file:///android_asset/mobile/index.html";

    private static final int FILE_CHOOSER_REQUEST_CODE = 2001;
    private static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 3001;

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private ValueCallback<Uri[]> mFilePathCallback;
    private boolean mIsLoadingFallback = false;
    private ConnectivityManager.NetworkCallback mNetworkCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView = (WebView) findViewById(R.id.webview);
        mProgressBar = (ProgressBar) findViewById(R.id.progress_bar);

        configureWebViewSettings();
        configureWebViewClients();
        configureDownloadListener();
        configureJavaScriptBridge();
        registerNetworkMonitoring();
        checkNotificationPermission();

        // Handle initial intent (e.g. deep link or standard launch)
        if (!handleIntent(getIntent())) {
            loadWorkspaceUrl();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private boolean handleIntent(Intent intent) {
        if (intent == null) return false;
        Uri data = intent.getData();
        if (data == null) return false;

        String scheme = data.getScheme();
        String host = data.getHost();

        if ("https".equalsIgnoreCase(scheme)) {
            if ("con.fr8x.in".equalsIgnoreCase(host) || "fr8x.app".equalsIgnoreCase(host) || "fr8x.in".equalsIgnoreCase(host)) {
                mIsLoadingFallback = false;
                mWebView.loadUrl(data.toString());
                return true;
            }
        } else if ("fr8x".equalsIgnoreCase(scheme)) {
            // Translate custom deep link scheme to production URL
            // e.g. fr8x://nexus -> https://con.fr8x.in/nexus
            // e.g. fr8x://auctions/123 -> https://con.fr8x.in/auctions/123
            String path = data.getPath() != null ? data.getPath() : "";
            if (host != null && !host.isEmpty()) {
                path = "/" + host + path;
            }
            String query = data.getQuery() != null ? "?" + data.getQuery() : "";
            String targetUrl = PRODUCTION_URL + path + query;
            mIsLoadingFallback = false;
            mWebView.loadUrl(targetUrl);
            return true;
        }

        return false;
    }

    public void loadWorkspaceUrl() {
        mIsLoadingFallback = false;
        mWebView.loadUrl(PRODUCTION_URL);
    }

    private void checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, NOTIFICATION_PERMISSION_REQUEST_CODE);
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebViewSettings() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Security Hardening: Disable arbitrary local file access from web pages
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        // Security Hardening: Strict Mixed Content policy (Never allow insecure HTTP content inside HTTPS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(mWebView, true);
        }
        CookieManager.getInstance().setAcceptCookie(true);

        // Viewport and Rendering optimizations
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setGeolocationEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    }

    private void configureJavaScriptBridge() {
        mWebView.addJavascriptInterface(new FR8XNativeBridge(), "FR8XAndroid");
    }

    private void configureWebViewClients() {
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (mProgressBar != null) {
                    mProgressBar.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (mProgressBar != null) {
                    mProgressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                // If main frame fails to load due to network error, switch to authentic offline resilience UI
                if (request.isForMainFrame() && !mIsLoadingFallback) {
                    mIsLoadingFallback = true;
                    if (mProgressBar != null) {
                        mProgressBar.setVisibility(View.GONE);
                    }
                    mWebView.loadUrl(OFFLINE_URL);
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Strict Security: Cancel SSL on certificate mismatch or untrusted CA
                handler.cancel();
                Toast.makeText(MainActivity.this, "Security Error: SSL certificate verification failed.", Toast.LENGTH_LONG).show();
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                String host = uri.getHost();
                String path = uri.getPath();

                // Intercept static chunks, styles, and fonts to serve from bundled APK storage
                if ("https".equalsIgnoreCase(scheme) && 
                    ("con.fr8x.in".equalsIgnoreCase(host) || "fr8x.app".equalsIgnoreCase(host) || "fr8x.in".equalsIgnoreCase(host)) && 
                    path != null) {

                    String assetPath = null;
                    if (path.startsWith("/_next/static/")) {
                        assetPath = "bundle" + path;
                    } else if (path.startsWith("/fonts/")) {
                        assetPath = "bundle/public" + path;
                    } else if (path.equals("/logo.png") || path.equals("/icon.png") || 
                               path.equals("/favicon.ico") || path.equals("/apple-icon.png") ||
                               path.equals("/fr8x.png") || path.equals("/fr8x.svg") ||
                               path.equals("/manifest.json")) {
                        assetPath = "bundle/public" + path;
                    }

                    if (assetPath != null) {
                        try {
                            InputStream is = getAssets().open(assetPath);
                            String mimeType = getMimeType(path);
                            Map<String, String> responseHeaders = new HashMap<String, String>();
                            responseHeaders.put("Access-Control-Allow-Origin", "*");
                            responseHeaders.put("Cache-Control", "max-age=31536000, immutable");
                            return new WebResourceResponse(mimeType, "UTF-8", 200, "OK", responseHeaders, is);
                        } catch (Exception ignored) {
                            // If not in local assets bundle, fall back to network seamlessly
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {

                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                String host = uri.getHost();

                // 1. Native mobile intent schemes
                if ("tel".equalsIgnoreCase(scheme) || "mailto".equalsIgnoreCase(scheme) || 
                    "whatsapp".equalsIgnoreCase(scheme) || "sms".equalsIgnoreCase(scheme)) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "No application available to handle this action", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // 2. Allow internal FR8X enterprise domain paths
                if ("https".equalsIgnoreCase(scheme)) {
                    if ("con.fr8x.in".equalsIgnoreCase(host) || "fr8x.in".equalsIgnoreCase(host) || "fr8x.app".equalsIgnoreCase(host)) {
                        return false; // Load inside WebView
                    }

                    // 3. External third-party links (e.g. carrier tracking portals, Google Maps, payment gateways)
                    try {
                        Intent externalIntent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(externalIntent);
                        return true;
                    } catch (Exception ignored) {
                        return false;
                    }
                }

                return false;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (mProgressBar != null) {
                    mProgressBar.setProgress(newProgress);
                    if (newProgress >= 100) {
                        mProgressBar.setVisibility(View.GONE);
                    } else {
                        mProgressBar.setVisibility(View.VISIBLE);
                    }
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            // File Chooser for KYC, GSTIN, Sea Waybills and Cargo documents
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                    mFilePathCallback = null;
                }
                mFilePathCallback = filePathCallback;

                try {
                    Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                    contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                    
                    if (fileChooserParams != null && fileChooserParams.getAcceptTypes() != null && fileChooserParams.getAcceptTypes().length > 0) {
                        String[] types = fileChooserParams.getAcceptTypes();
                        if (types.length == 1 && !types[0].isEmpty()) {
                            contentSelectionIntent.setType(types[0]);
                        } else {
                            contentSelectionIntent.setType("*/*");
                            contentSelectionIntent.putExtra(Intent.EXTRA_MIME_TYPES, types);
                        }
                    } else {
                        contentSelectionIntent.setType("*/*");
                    }

                    Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                    chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                    chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Document or Image");

                    startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                    return true;
                } catch (Exception e) {
                    if (mFilePathCallback != null) {
                        mFilePathCallback.onReceiveValue(null);
                        mFilePathCallback = null;
                    }
                    Toast.makeText(MainActivity.this, "Unable to open file selector", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private void configureDownloadListener() {
        mWebView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimeType);
                    String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                    request.setTitle(fileName);
                    request.setDescription("Downloading freight document...");
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Downloading " + fileName, Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                }
            }
        });
    }

    private void registerNetworkMonitoring() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                NetworkRequest request = new NetworkRequest.Builder()
                        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                        .build();

                mNetworkCallback = new ConnectivityManager.NetworkCallback() {
                    @Override
                    public void onAvailable(Network network) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (mIsLoadingFallback) {
                                    loadWorkspaceUrl();
                                }
                            }
                        });
                    }
                };
                cm.registerNetworkCallback(request, mNetworkCallback);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (mFilePathCallback == null) return;
            Uri[] results = null;

            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    final int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            mFilePathCallback.onReceiveValue(results);
            mFilePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && mNetworkCallback != null) {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                try {
                    cm.unregisterNetworkCallback(mNetworkCallback);
                } catch (Exception ignored) {}
            }
        }
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }

    // =========================================================================
    // FR8X Native Bridge for Web Workspace Integration
    // =========================================================================
    public class FR8XNativeBridge {

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "2.4.0";
        }

        @JavascriptInterface
        public void reloadProduction() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    loadWorkspaceUrl();
                }
            });
        }

        @JavascriptInterface
        public void showToast(final String message) {
            if (message == null) return;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(long durationMs) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(Math.min(durationMs, 500), VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(Math.min(durationMs, 500));
                    }
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void shareFreightDemand(final String title, final String text, final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent sendIntent = new Intent();
                        sendIntent.setAction(Intent.ACTION_SEND);
                        sendIntent.putExtra(Intent.EXTRA_TEXT, (text != null ? text + " " : "") + (url != null ? url : ""));
                        sendIntent.putExtra(Intent.EXTRA_SUBJECT, title != null ? title : "FR8X Freight Demand");
                        sendIntent.setType("text/plain");

                        Intent shareIntent = Intent.createChooser(sendIntent, title != null ? title : "Share Freight Demand");
                        startActivity(shareIntent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Unable to open share menu", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean isOnline() {
            try {
                ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        Network nw = cm.getActiveNetwork();
                        if (nw == null) return false;
                        NetworkCapabilities actNw = cm.getNetworkCapabilities(nw);
                        return actNw != null && (actNw.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                                actNw.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                                actNw.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
                    } else {
                        android.net.NetworkInfo netInfo = cm.getActiveNetworkInfo();
                        return netInfo != null && netInfo.isConnected();
                    }
                }
            } catch (Exception ignored) {}
            return false;
        }
    }


    private static String getMimeType(String path) {
        if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".ttf")) return "font/ttf";
        if (path.endsWith(".woff")) return "font/woff";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".ico")) return "image/x-icon";
        if (path.endsWith(".html")) return "text/html";
        return "application/octet-stream";
    }
}

