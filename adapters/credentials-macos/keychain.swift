// Closed OS binding. Main owns all state, authorization and error presentation.
import Foundation
import Security

let service = "com.juanerai.xanthil.xiaomi-token-plan-cn"
let account = "api-key"
func finish(_ value: [String: Any]) -> Never {
    let data = (try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])) ?? Data("{\"status\":\"protocol_error\"}".utf8)
    FileHandle.standardOutput.write(data)
    exit(0)
}
func result(_ status: OSStatus) -> Never {
    if status == errSecSuccess { finish(["status": "ok"]) }
    if status == errSecItemNotFound { finish(["status": "absent"]) }
    finish(["status": "unavailable", "os_status": Int(status)])
}
guard CommandLine.arguments.count == 1 else { finish(["status": "invalid_request"]) }
let raw = FileHandle.standardInput.readData(ofLength: 8193)
guard raw.count <= 8192,
      let input = (try? JSONSerialization.jsonObject(with: raw)) as? [String: Any],
      let op = input["operation"] as? String,
      let interactive = input["interactive"] as? Bool,
      Set(input.keys) == (op == "save" ? Set(["operation", "interactive", "key"]) : Set(["operation", "interactive"]))
else { finish(["status": "invalid_request"]) }
SecKeychainSetUserInteractionAllowed(interactive)
let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                          kSecAttrService as String: service,
                          kSecAttrAccount as String: account,
                          kSecAttrSynchronizable as String: false]
switch op {
case "inspect":
    var q = query
    q[kSecReturnAttributes as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    let status = SecItemCopyMatching(q as CFDictionary, &item)
    if status == errSecSuccess { finish(["status": "present", "synchronizable": false]) }
    result(status)
case "read":
    var q = query
    q[kSecReturnData as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    let status = SecItemCopyMatching(q as CFDictionary, &item)
    guard status == errSecSuccess else { result(status) }
    guard let data = item as? Data, data.count <= 4096,
          let key = String(data: data, encoding: .utf8) else { finish(["status": "protocol_error"]) }
    finish(["status": "found", "key": key]) // Only the private parent pipe consumes this.
case "save":
    guard let key = input["key"] as? String, !key.isEmpty, key.utf8.count <= 4096,
          !key.contains("\n"), !key.contains("\r"), !key.contains("\0")
    else { finish(["status": "invalid_request"]) }
    let data = Data(key.utf8)
    let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
    if status == errSecItemNotFound {
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrLabel as String] = "Xanthil Xiaomi Token Plan CN"
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        result(SecItemAdd(item as CFDictionary, nil))
    }
    result(status)
case "delete": result(SecItemDelete(query as CFDictionary))
default: finish(["status": "invalid_request"])
}
