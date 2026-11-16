import Foundation
import StoreKit
import WebKit

/// Verified StoreKit 2 non-consumable entitlement, available to the bundled game only.
/// This file belongs in the iOS Xcode target, not on the public web server.
@MainActor
final class FeedTheWolfStoreBridge: NSObject, WKScriptMessageHandler {
    static let productID = "feed_the_wolf_full_unlock"
    static let handlerName = "feedTheWolfStore"
    private weak var webView: WKWebView?

    func attach(to webView: WKWebView) {
        self.webView = webView
        let js = """
        (() => {
          let seq = 0;
          const pending = new Map();
          function request(action, productId) {
            return new Promise((resolve, reject) => {
              if (!window.webkit?.messageHandlers?.feedTheWolfStore) {
                reject(new Error("App Store bridge unavailable")); return;
              }
              const requestId = String(++seq);
              pending.set(requestId, {resolve, reject});
              window.webkit.messageHandlers.feedTheWolfStore.postMessage({
                requestId, action, productId
              });
            });
          }
          window.__FTWStoreReply = (result) => {
            const wait = pending.get(result.requestId);
            if (!wait) return;
            pending.delete(result.requestId);
            if (result.error) wait.reject(new Error(result.error));
            else wait.resolve(result.data);
          };
          window.FeedTheWolfStore = Object.freeze({
            status: (id) => request("status", id),
            purchase: (id) => request("purchase", id),
            restore: (id) => request("restore", id)
          });
        })();
        """
        webView.configuration.userContentController.addUserScript(
            WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        webView.configuration.userContentController.add(self, name: Self.handlerName)
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.handlerName,
              message.frameInfo.isMainFrame,
              let body = message.body as? [String: Any],
              let requestId = body["requestId"] as? String,
              let action = body["action"] as? String,
              let productId = body["productId"] as? String else { return }

        Task {
            let response = await perform(action: action, productId: productId)
            var answer: [String: Any] = ["requestId": requestId]
            if let error = response["error"] { answer["error"] = error }
            else { answer["data"] = response }
            guard JSONSerialization.isValidJSONObject(answer),
                  let json = try? JSONSerialization.data(withJSONObject: answer),
                  let text = String(data: json, encoding: .utf8) else { return }
            webView?.evaluateJavaScript("window.__FTWStoreReply(\(text))", completionHandler: nil)
        }
    }

    private func perform(action: String, productId: String) async -> [String: Any] {
        guard productId == Self.productID else { return ["error": "Unknown product"] }
        guard ["status", "purchase", "restore"].contains(action) else {
            return ["error": "Unknown StoreKit action"]
        }
        do {
            let product = try await Product.products(for: [Self.productID]).first
            if action == "purchase" {
                guard let product else { return ["error": "Product is not available in the App Store"] }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        return ["error": "Purchase transaction not verified by StoreKit"]
                    }
                    await transaction.finish()
                case .pending:
                    return ["productId": productId, "verified": false, "entitled": false]
                case .userCancelled:
                    return ["productId": productId, "verified": false, "entitled": false]
                @unknown default:
                    return ["error": "Unsupported purchase status"]
                }
            } else if action == "restore" {
                try await AppStore.sync()
            }
            // Always use CURRENT VERIFIED ENTITLEMENTS, not purchase callback or local storage.
            var entitled = false
            for await item in Transaction.currentEntitlements {
                guard case .verified(let transaction) = item,
                      transaction.productID == Self.productID,
                      transaction.revocationDate == nil else { continue }
                if let expiry = transaction.expirationDate, expiry <= Date() { continue }
                entitled = true
                break
            }
            var response: [String: Any] = [
                "productId": productId,
                "verified": true,
                "entitled": entitled
            ]
            if let product { response["displayPrice"] = product.displayPrice }
            return response
        } catch {
            return ["error": "App Store request failed. Try again."]
        }
    }
}
