import Foundation
import Vision
import ImageIO
struct Input: Decodable {let bytes:String}
struct Output: Encodable {let rows:[[String]];let limitations:[String];let status:String}
func reject(_ code:String) -> Never {print("{\"error\":\""+code+"\"}");exit(1)}
guard let input=try? JSONDecoder().decode(Input.self,from:FileHandle.standardInput.readDataToEndOfFile()),let bytes=Data(base64Encoded:input.bytes),bytes.count<=8*1024*1024,let source=CGImageSourceCreateWithData(bytes as CFData,nil),CGImageSourceGetCount(source)==1,let properties=CGImageSourceCopyPropertiesAtIndex(source,0,nil) as? [String:Any],let width=properties[kCGImagePropertyPixelWidth as String] as? Int,let height=properties[kCGImagePropertyPixelHeight as String] as? Int,width>0,height>0,width<=16000,height<=16000,width*height<=16000000 else {reject("SOURCE_IMAGE_INVALID")}
let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate;request.recognitionLanguages=["zh-Hans","en-US"];request.usesLanguageCorrection=false
let handler=VNImageRequestHandler(data:bytes,options:[:])
do {try handler.perform([request])} catch {reject("SOURCE_IMAGE_READER_FAILED")}
let results=(request.results ?? []).sorted {a,b in abs(a.boundingBox.midY-b.boundingBox.midY)>0.01 ? a.boundingBox.midY>b.boundingBox.midY:a.boundingBox.minX<b.boundingBox.minX}
var rows:[[String]]=[]
for observation in results {guard let text=observation.topCandidates(1).first else {continue};let r=observation.boundingBox;rows.append([String(format:"OCR:%d 置信度:%.3f 区域:%.4f,%.4f,%.4f,%.4f",rows.count+1,text.confidence,r.minX,r.minY,r.width,r.height),text.string]);if rows.count>100000 || text.string.count>32767 {reject("SOURCE_CAPACITY")}}
if rows.isEmpty {reject("SOURCE_IMAGE_TEXT_EMPTY")}
let output=Output(rows:rows,limitations:["本机OCR文字尚未经人工确认；位置、数字、表格关系和识别顺序可能有误，不能直接作为已核验计算事实。"],status:"ocr_unconfirmed")
guard let data=try? JSONEncoder().encode(output),data.count<=16*1024*1024,let text=String(data:data,encoding:.utf8) else {reject("SOURCE_CAPACITY")};print(text)
