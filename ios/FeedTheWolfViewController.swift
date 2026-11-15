import UIKit
import WebKit

/// Embed the game's local HTML/JS bundle and expose the verified StoreKit bridge.
/// Add this view controller as the app's initial screen in an iOS 16+ Xcode target.
@MainActor
final class FeedTheWolfViewController: UIViewController {
    private let storeBridge = FeedTheWolfStoreBridge()
    private var gameView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.10, green: 0.08, blue: 0.22, alpha: 1)

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.isOpaque = false
        web.backgroundColor = view.backgroundColor
        web.scrollView.backgroundColor = view.backgroundColor
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            web.topAnchor.constraint(equalTo: view.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        gameView = web
        storeBridge.attach(to: web)

        guard let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") else {
            assertionFailure("Missing bundled www/index.html")
            return
        }
        // Read only the game bundle, not arbitrary web domains.
        web.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
    }
}
