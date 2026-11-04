// Makes the App Store headline screenshots in store/ios/listing/ (1320x2868 JPEG, no alpha).
// Run from store/ios/listing with the app's fonts, one call per image, for example:
//   swift compose.swift ../../../mobile/assets/google_fonts 01.jpg ../iphone-1-shorts.png FF4E9B 8B5CF6 \
//     $'Happy videos,\none swipe away' "Opens straight into cartoons and rhymes" "🎈⭐️🌈🎵"
// The 1.5.2 set: 01 shorts (FF4E9B→8B5CF6), 02 iphone-3-player (22C55E→1677FF, "Learn ABCs while they giggle"),
// 03 iphone-9-rhyme-player (1677FF→8B5CF6, "Sing along to nursery rhymes"), 04 home (FF8A00→FF4E9B),
// 05 iphone-5-category (8B5CF6→1677FF, "Every video checked by a person"), 06 explore (1AE6FC→1677FF),
// 07 gate (1E1B3A→8B5CF6, "Grown-up areas stay locked"), 08 grownups (22C55E→0EA5A4, "No ads. No chat.\nNo sign-up.").
// Only claim what the app does (guideline 2.3).
// Store screenshot composer: headline + subline on a brand gradient, real app screen in a phone frame.
// swift compose.swift <fontsDir> <out.jpg> <screen.png> <hexTop> <hexBottom> <headline> <subline> <stickers>
import AppKit
import CoreText

let a = CommandLine.arguments
let fontsDir = a[1], outPath = a[2], screenPath = a[3]
let topHex = a[4], bottomHex = a[5], headline = a[6], subline = a[7], stickers = Array(a[8])

for f in ["Baloo2-Bold.ttf", "Nunito-ExtraBold.ttf"] {
    CTFontManagerRegisterFontsForURL(URL(fileURLWithPath: fontsDir + "/" + f) as CFURL, .process, nil)
}
func color(_ hex: String, _ alpha: CGFloat = 1) -> NSColor {
    let v = UInt32(hex, radix: 16)!
    return NSColor(srgbRed: CGFloat((v >> 16) & 0xff) / 255, green: CGFloat((v >> 8) & 0xff) / 255, blue: CGFloat(v & 0xff) / 255, alpha: alpha)
}

let W: CGFloat = 1320, H: CGFloat = 2868
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(W), pixelsHigh: Int(H), bitsPerSample: 8, samplesPerPixel: 4,
                           hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
_ = ctx
// Layout below is written top-down; r() converts to AppKit's bottom-left origin.
func r(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> NSRect { NSRect(x: x, y: H - y - h, width: w, height: h) }

// background gradient
NSGradient(starting: color(topHex), ending: color(bottomHex))!.draw(in: r(0, 0, W, H), angle: -90)
// soft bubbles
for (x, y, rad, al) in [(120.0, 300.0, 220.0, 0.10), (1230.0, 520.0, 300.0, 0.08), (80.0, 1900.0, 260.0, 0.07), (1260.0, 2500.0, 340.0, 0.08)] {
    color("FFFFFF", al).setFill(); NSBezierPath(ovalIn: r(x - rad, y - rad, 2 * rad, 2 * rad)).fill()
}

func draw(_ text: String, font: NSFont, color c: NSColor, rect: NSRect, shadow: Bool) {
    let p = NSMutableParagraphStyle(); p.alignment = .center; p.lineBreakMode = .byWordWrapping; p.minimumLineHeight = font.pointSize * 1.04; p.maximumLineHeight = font.pointSize * 1.04
    var attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: c, .paragraphStyle: p]
    if shadow { let s = NSShadow(); s.shadowColor = NSColor(white: 0, alpha: 0.22); s.shadowOffset = NSSize(width: 0, height: 6); s.shadowBlurRadius = 18; attrs[.shadow] = s }
    NSAttributedString(string: text, attributes: attrs).draw(in: rect)
}
draw(headline, font: NSFont(name: "Baloo2-Bold", size: 120)!, color: .white, rect: r(70, 168, W - 140, 290), shadow: true)
draw(subline, font: NSFont(name: "Nunito-ExtraBold", size: 54)!, color: color("FFFFFF", 0.94), rect: r(90, 470, W - 180, 140), shadow: false)

// phone frame with the real screen
let screen = NSImage(contentsOfFile: screenPath)!
let sw: CGFloat = 1000, sh = sw * 2868 / 1320, sx = (W - sw) / 2, sy: CGFloat = 640
let bezel: CGFloat = 26, radius: CGFloat = 132
let frameRect = r(sx - bezel, sy - bezel, sw + 2 * bezel, sh + 2 * bezel)
NSGraphicsContext.saveGraphicsState()
let sh1 = NSShadow(); sh1.shadowColor = NSColor(white: 0, alpha: 0.35); sh1.shadowOffset = NSSize(width: 0, height: 24); sh1.shadowBlurRadius = 60; sh1.set()
color("1E1B3A").setFill(); NSBezierPath(roundedRect: frameRect, xRadius: radius + bezel, yRadius: radius + bezel).fill()
NSGraphicsContext.restoreGraphicsState()
NSGraphicsContext.saveGraphicsState()
NSBezierPath(roundedRect: r(sx, sy, sw, sh), xRadius: radius, yRadius: radius).addClip()
screen.draw(in: r(sx, sy, sw, sh), from: .zero, operation: .copy, fraction: 1)
NSGraphicsContext.restoreGraphicsState()

// a few emoji stickers around the headline
let spots: [(CGFloat, CGFloat, CGFloat, CGFloat)] = [(46, 40, 92, -0.25), (1180, 36, 96, 0.2), (1196, 560, 80, -0.15), (44, 560, 78, 0.18)]
for (i, ch) in stickers.prefix(spots.count).enumerated() {
    let (x, ytop, size, rot) = spots[i]; let y = H - ytop - size
    NSGraphicsContext.saveGraphicsState()
    let t = NSAffineTransform(); t.translateX(by: x + size / 2, yBy: y + size / 2); t.rotate(byRadians: rot); t.translateX(by: -(x + size / 2), yBy: -(y + size / 2)); t.concat()
    NSAttributedString(string: String(ch), attributes: [.font: NSFont(name: "Apple Color Emoji", size: size)!]).draw(at: NSPoint(x: x, y: y))
    NSGraphicsContext.restoreGraphicsState()
}
NSGraphicsContext.restoreGraphicsState()

let jpg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.92])!
try! jpg.write(to: URL(fileURLWithPath: outPath))
print("wrote", outPath)
