import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  Linking,
  TouchableOpacity,
  Text,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { Play, ExternalLink, RefreshCw } from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';

// React 19 type compatibility helper for react-native-webview
const SafeWebView = WebView as unknown as React.ComponentType<any>;

export interface YouTubeEmbedPlayerProps {
  videoId: string;
  height?: number;
  theme?: ThemePalette;
  title?: string;
  autoPlay?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onOpenDirect?: () => void;
}

export const YouTubeEmbedPlayer: React.FC<YouTubeEmbedPlayerProps> = ({
  videoId,
  height = 215,
  theme,
  title,
  autoPlay = false,
  containerStyle,
  onOpenDirect,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<any>(null);

  const cleanVideoId = (videoId || '').trim();
  const thumbnailUrl = `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`;

  const handleOpenApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onOpenDirect) {
      onOpenDirect();
      return;
    }
    const appUrl = `vnd.youtube://${cleanVideoId}`;
    const webUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Linking.openURL(webUrl).catch(() => {});
    }
  };

  const handleRetry = () => {
    Haptics.selectionAsync();
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  // Embed HTML that renders the YouTube iframe with optimal mobile viewport settings and zero margins
  const embedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000000;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <iframe
      src="https://www.youtube-nocookie.com/embed/${cleanVideoId}?playsinline=1&rel=0&modestbranding=1&controls=1&enablejsapi=1&autoplay=${autoPlay ? 1 : 0}"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  </div>
</body>
</html>
  `;

  return (
    <View style={[styles.outerContainer, { height }, containerStyle]}>
      {!hasError ? (
        <View style={styles.webWrapper}>
          <SafeWebView
            ref={webViewRef}
            source={{
              html: embedHtml,
              baseUrl: 'https://www.youtube-nocookie.com',
            }}
            style={styles.webView}
            containerStyle={styles.webViewContainer}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            androidLayerType="hardware"
            mixedContentMode="always"
            userAgent={Platform.select({
              android:
                'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
              ios: undefined,
            })}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={(syntheticEvent: { nativeEvent: any }) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('[YouTubeEmbedPlayer] WebView load error:', nativeEvent);
              setHasError(true);
              setIsLoading(false);
            }}
            onHttpError={(syntheticEvent: { nativeEvent: { statusCode: number } }) => {
              const { nativeEvent } = syntheticEvent;
              if (nativeEvent.statusCode >= 400 && nativeEvent.statusCode !== 404) {
                console.warn('[YouTubeEmbedPlayer] HTTP Error:', nativeEvent.statusCode);
              }
            }}
            onShouldStartLoadWithRequest={(request: { url: string }) => {
              const url = request.url || '';
              // Allow initial page load, no-cookie domain, embed routes, and streaming assets
              if (
                url === 'about:blank' ||
                url.startsWith('data:') ||
                url.includes('youtube-nocookie.com') ||
                url.includes('youtube.com/embed') ||
                url.includes('googlevideo.com') ||
                url.includes('google.com') ||
                url.includes('gstatic.com') ||
                url.includes('ytimg.com')
              ) {
                return true;
              }

              // External YouTube navigation: redirect directly into YouTube app
              if (url.includes('youtube.com') || url.includes('youtu.be')) {
                Linking.openURL(url).catch(() => {});
                return false;
              }

              return true;
            }}
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#FF0000" />
              <Text style={styles.loadingText}>Loading Video Player...</Text>
            </View>
          )}
        </View>
      ) : (
        /* Fallback View with High-Resolution Thumbnail & 1-Tap Play */
        <View style={styles.fallbackContainer}>
          <Image source={{ uri: thumbnailUrl }} style={styles.fallbackThumbnail} resizeMode="cover" />
          <View style={styles.fallbackBackdrop} />

          <TouchableOpacity style={styles.playCenterBtn} onPress={handleOpenApp} activeOpacity={0.85}>
            <View style={styles.playIconCircle}>
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.watchPromptText}>Tap to Watch in YouTube App</Text>
          </TouchableOpacity>

          <View style={styles.fallbackBottomRow}>
            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn} activeOpacity={0.8}>
              <RefreshCw size={12} color="#AAAAAA" />
              <Text style={styles.retryText}>Reload Player</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenApp} style={styles.fallbackAppBtn} activeOpacity={0.8}>
              <ExternalLink size={12} color="#FF453A" />
              <Text style={styles.fallbackAppText}>Open YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  webWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  webViewContainer: {
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fallbackContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  fallbackThumbnail: {
    ...StyleSheet.absoluteFill,
    opacity: 0.55,
  },
  fallbackBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  playCenterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  playIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  watchPromptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fallbackBottomRow: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  retryText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '600',
  },
  fallbackAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  fallbackAppText: {
    color: '#FF453A',
    fontSize: 11,
    fontWeight: '700',
  },
});
