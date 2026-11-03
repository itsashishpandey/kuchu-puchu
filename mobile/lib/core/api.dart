import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config.dart';
import 'preferences.dart';

/// A readable failure from the server ({ error: "..." }) or the network.
class ApiException implements Exception {
  final String message;
  final int? status;

  /// The full error body (e.g. {error, resendIn} on 429).
  final Map<String, dynamic>? data;
  ApiException(this.message, [this.status, this.data]);
  @override
  String toString() => message;
}

/// Thin Dio wrapper: never throws on 4xx at the Dio level, and turns error payloads into
/// [ApiException] with the server's message so screens can show it as-is.
/// The app has no accounts — every request is anonymous.
class ApiClient {
  final Dio dio;

  /// Interface language for category names ("en", "hi"…). Added to GET requests as `?locale=`.
  String Function()? localeOf;

  ApiClient()
      : dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBase,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 60),
          validateStatus: (s) => s != null && s < 500,
          headers: {'User-Agent': 'KuchuPuchuApp/${AppConfig.version} (Android)'},
        )) {
    final host = Uri.parse(AppConfig.serverUrl).host;
    dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      if (options.uri.host == host && options.method == 'GET' && !options.queryParameters.containsKey('locale')) {
        String loc = 'en';
        try {
          loc = localeOf?.call() ?? 'en';
        } catch (_) {}
        if (loc != 'en') options.queryParameters['locale'] = loc;
      }
      handler.next(options);
    }));
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => dio.get(path, queryParameters: query));

  Future<Map<String, dynamic>> post(String path, [Object? data]) => _send(() => dio.post(path, data: data));

  Future<Map<String, dynamic>> _send(Future<Response> Function() call) async {
    Response res;
    try {
      res = await call();
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status != null && status >= 500) {
        throw ApiException('Something went wrong on our side. Please try again.', status);
      }
      throw ApiException("Can't reach Kuchu Puchu. Check your internet connection and try again.");
    }
    final body = res.data;
    final map = body is Map<String, dynamic> ? body : <String, dynamic>{};
    final status = res.statusCode ?? 0;
    if (status >= 400) {
      throw ApiException((map['error'] ?? 'Request failed ($status)').toString(), status, map);
    }
    return map;
  }
}

final Provider<ApiClient> apiProvider = Provider<ApiClient>((ref) {
  final api = ApiClient();
  // read lazily on each request (never while the providers are being built)
  api.localeOf = () => ref.read(uiLocaleProvider);
  return api;
});
