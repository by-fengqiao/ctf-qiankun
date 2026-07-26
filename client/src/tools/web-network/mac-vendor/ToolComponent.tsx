import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const OUI_DB: Record<string, string> = {
  // ─── Virtual / Cloud ───────────────────────────────────────────────
  '000C29': 'VMware', '005056': 'VMware', '000569': 'VMware',
  '080027': 'VirtualBox (Oracle)',
  '001C42': 'Parallels',
  '00155D': 'Microsoft (Hyper-V)', '001DD8': 'Microsoft (Hyper-V)',
  // ─── Apple ─────────────────────────────────────────────────────────
  '002312': 'Apple', '002332': 'Apple', '00236C': 'Apple', '0023DF': 'Apple',
  '002436': 'Apple', '002500': 'Apple', '00254B': 'Apple', '0025BC': 'Apple',
  '002608': 'Apple', '00264A': 'Apple', '0026B0': 'Apple', '0026BB': 'Apple',
  '28E7CF': 'Apple', '40A6D9': 'Apple', '600308': 'Apple', '60FACD': 'Apple',
  '705681': 'Apple', '7867D7': 'Apple', '7C6DF8': 'Apple', '8C2DAA': 'Apple',
  '9C207B': 'Apple', 'A46706': 'Apple', 'AC87A3': 'Apple', 'B8E856': 'Apple',
  'C8BCC8': 'Apple', 'D02598': 'Apple', 'DC2B61': 'Apple', 'E0B9BA': 'Apple',
  'F0DCE2': 'Apple', '0009B7': 'Apple', '001999': 'Apple', 'ACDE48': 'Apple',
  '0021CC': 'Apple', '001FD0': 'Apple', '000A95': 'Apple', '0010FA': 'Apple',
  '001CB7': 'Apple', '0415F2': 'Apple', '001B63': 'Apple', 'F0C1F1': 'Apple',
  // ─── Cisco ─────────────────────────────────────────────────────────
  '00000C': 'Cisco', '000142': 'Cisco', '000163': 'Cisco', '000196': 'Cisco',
  '0001C7': 'Cisco', '0001C9': 'Cisco', '00024A': 'Cisco', '00027D': 'Cisco',
  '0002B9': 'Cisco', '0002FD': 'Cisco', '001CF0': 'Cisco', '001B54': 'Cisco',
  '0001E6': 'Cisco', '000CCE': 'Cisco', '000AA1': 'Cisco', '0050BA': 'Cisco',
  '00000E': 'Cisco', '000010': 'Cisco', '000011': 'Cisco', '000012': 'Cisco',
  '000013': 'Cisco', '000014': 'Cisco', '000016': 'Cisco', '000018': 'Cisco',
  '00001B': 'Cisco', '00001D': 'Cisco', '00001E': 'Cisco', '000021': 'Cisco',
  '000022': 'Cisco', '000025': 'Cisco', '000028': 'Cisco', '00002A': 'Cisco',
  '00002E': 'Cisco',
  // ─── Intel ─────────────────────────────────────────────────────────
  '0002B3': 'Intel', '000347': 'Intel', '000423': 'Intel', '0007E9': 'Intel',
  '000CF1': 'Intel', '000E0C': 'Intel', '000E35': 'Intel', '001111': 'Intel',
  '0012F0': 'Intel', '001302': 'Intel', '001320': 'Intel', '0013CE': 'Intel',
  '0013E8': 'Intel', '001500': 'Intel', '001517': 'Intel', '00166F': 'Intel',
  '001676': 'Intel', '0016EA': 'Intel', '0016EB': 'Intel', '0018DE': 'Intel',
  '0019D1': 'Intel', '0019D2': 'Intel', '001B21': 'Intel', '001B77': 'Intel',
  '001CBF': 'Intel', '001CC0': 'Intel', '001DE0': 'Intel', '001DE1': 'Intel',
  '001E64': 'Intel', '001E65': 'Intel', '001F3B': 'Intel', '001F3C': 'Intel',
  '00207B': 'Intel', '00215C': 'Intel', '00215D': 'Intel', '00216A': 'Intel',
  '00216B': 'Intel', '002243': 'Intel', '0022FA': 'Intel', '0022FB': 'Intel',
  '002314': 'Intel', '002315': 'Intel', '0024D6': 'Intel', '0024D7': 'Intel',
  '0026C6': 'Intel', '0026C7': 'Intel', '002710': 'Intel', '0027E0': 'Intel',
  '00070E': 'Intel', '000D3A': 'Intel',
  // ─── Huawei ────────────────────────────────────────────────────────
  '001882': 'Huawei', '001E10': 'Huawei', '0022A1': 'Huawei', '00259E': 'Huawei',
  '0034FE': 'Huawei', '0C37DC': 'Huawei', '10C61F': 'Huawei', '20F3A3': 'Huawei',
  '286ED4': 'Huawei', '4846FB': 'Huawei', '54A51B': 'Huawei', '70723C': 'Huawei',
  '8853D4': 'Huawei', '9C37F4': 'Huawei', 'AC853D': 'Huawei', 'C85195': 'Huawei',
  'E0247F': 'Huawei', 'F4C714': 'Huawei', '002546': 'Huawei', '002549': 'Huawei',
  '0030D4': 'Huawei', '0046D9': 'Huawei', '0049F1': 'Huawei', '004826': 'Huawei',
  '08003E': 'Huawei',
  // ─── Xiaomi ────────────────────────────────────────────────────────
  '0C1DAF': 'Xiaomi', '14F65A': 'Xiaomi', '185936': 'Xiaomi', '28E31F': 'Xiaomi',
  '3480B3': 'Xiaomi', '508A0F': 'Xiaomi', '64B473': 'Xiaomi', '742344': 'Xiaomi',
  '7C1DD9': 'Xiaomi', '8CBE24': 'Xiaomi', '9C99A0': 'Xiaomi', 'AC587B': 'Xiaomi',
  'B0E235': 'Xiaomi', 'D4970B': 'Xiaomi', 'F0B429': 'Xiaomi', 'F4F5D8': 'Xiaomi',
  'F8A45F': 'Xiaomi', '0018E7': 'Xiaomi', '002861': 'Xiaomi', '043325': 'Xiaomi',
  '0C1D67': 'Xiaomi', '0C5C08': 'Xiaomi', '14516B': 'Xiaomi', '28E02A': 'Xiaomi',
  '1C9056': 'Xiaomi',
  // ─── TP-Link ───────────────────────────────────────────────────────
  '001D0F': 'TP-Link', '002127': 'TP-Link', '0023CD': 'TP-Link', '002586': 'TP-Link',
  '002719': 'TP-Link', '14CC20': 'TP-Link', '1C6E4C': 'TP-Link', '30B5C2': 'TP-Link',
  '50C7BF': 'TP-Link', '54C80F': 'TP-Link', '60E327': 'TP-Link', '645601': 'TP-Link',
  '6466B3': 'TP-Link', '647002': 'TP-Link', '6CE873': 'TP-Link', '74DA38': 'TP-Link',
  '78A106': 'TP-Link', '8416F9': 'TP-Link', '8C210A': 'TP-Link', '90F652': 'TP-Link',
  '94D9B3': 'TP-Link', 'A0F3C1': 'TP-Link', 'A42BB0': 'TP-Link', 'AC84C6': 'TP-Link',
  'B0487A': 'TP-Link', 'C025E9': 'TP-Link', 'C04A00': 'TP-Link', 'C46E1F': 'TP-Link',
  'C4E984': 'TP-Link', 'D85D4C': 'TP-Link', 'E848B8': 'TP-Link', 'EC086B': 'TP-Link',
  'EC172F': 'TP-Link', 'F483CD': 'TP-Link', 'F81A67': 'TP-Link', 'F8D111': 'TP-Link',
  'C03F0E': 'TP-Link', 'F4EC38': 'TP-Link', '603273': 'TP-Link', '001349': 'TP-Link',
  // ─── Dell ──────────────────────────────────────────────────────────
  '00065B': 'Dell', '000874': 'Dell', '000BDB': 'Dell', '000D56': 'Dell',
  '000F1F': 'Dell', '001143': 'Dell', '00123F': 'Dell', '001372': 'Dell',
  '001422': 'Dell', '0015C5': 'Dell', '00188B': 'Dell', '0019B9': 'Dell',
  '001AA0': 'Dell', '001C23': 'Dell', '001D09': 'Dell', '001E4F': 'Dell',
  '001EC9': 'Dell', '002170': 'Dell', '00219B': 'Dell', '002219': 'Dell',
  '0023AE': 'Dell', '0024E8': 'Dell', '002564': 'Dell', '0026B9': 'Dell',
  '0050DA': 'Dell', '006018': 'Dell', '0080AD': 'Dell', '00B0D0': 'Dell',
  '00C04F': 'Dell', '00DBDF': 'Dell', '0C413E': 'Dell', '100BA9': 'Dell',
  '109836': 'Dell', '141877': 'Dell', '149ECF': 'Dell', '14B31F': 'Dell',
  '14FEB5': 'Dell', '180373': 'Dell', '1866DA': 'Dell', '18A99B': 'Dell',
  '18DBF2': 'Dell', '18FB7B': 'Dell', '1C1B0D': 'Dell', '1C4024': 'Dell',
  '1C98EC': 'Dell', '204747': 'Dell', '208984': 'Dell', '246E96': 'Dell',
  '24B6FD': 'Dell', '28F10E': 'Dell', '2C768A': 'Dell', '305A3A': 'Dell',
  '3417EB': 'Dell', '34E6D7': 'Dell', '3822E2': 'Dell', '3C2AF4': 'Dell',
  '40A8F0': 'Dell', '4437E6': 'Dell', '44A842': 'Dell', '484D7E': 'Dell',
  '4C7625': 'Dell', '509A4C': 'Dell', '549F35': 'Dell', '54BF64': 'Dell',
  '5882A8': 'Dell', '5C260A': 'Dell', '64006A': 'Dell', '68F728': 'Dell',
  '6C2B59': 'Dell', '70106F': 'Dell', '74867A': 'Dell', '74E6E2': 'Dell',
  '782BCB': 'Dell', '7845C4': 'Dell', '7C7C34': 'Dell', '801844': 'Dell',
  '847BEB': 'Dell', '848F69': 'Dell', '88AE1D': 'Dell', '8C04FF': 'Dell',
  '8CDCD4': 'Dell', '90B11C': 'Dell', '94C691': 'Dell', '9840BB': 'Dell',
  '9C7F57': 'Dell', 'A0A8CD': 'Dell', 'A41F72': 'Dell', 'A44CC8': 'Dell',
  'A4BA76': 'Dell', 'A81E84': 'Dell', 'A89969': 'Dell', 'AC6462': 'Dell',
  'B083FE': 'Dell', 'B4E10F': 'Dell', 'B82A72': 'Dell', 'B8AC6F': 'Dell',
  'B8CA3A': 'Dell', 'BC0F64': 'Dell', 'BC305B': 'Dell', 'C03896': 'Dell',
  'C49DE2': 'Dell', 'C81F66': 'Dell', 'CC3D82': 'Dell', 'D067E5': 'Dell',
  'D481D7': 'Dell', 'D4BED9': 'Dell', 'D89EF3': 'Dell', 'DC9FDB': 'Dell',
  'E0DB55': 'Dell', 'E4F042': 'Dell', 'E8B4C8': 'Dell', 'EC2C49': 'Dell',
  'F01FAF': 'Dell', 'F04DA2': 'Dell', 'F48E92': 'Dell', 'F8BC12': 'Dell',
  'F8CAB8': 'Dell', 'FCE557': 'Dell', '000BCD': 'Dell', 'F0DEF1': 'Dell',
  '001847': 'Dell', '001A82': 'Dell', '002318': 'Dell', 'D4AE52': 'Dell',
  '6C2EA5': 'Dell', 'F45D42': 'Dell', '50461D': 'Dell',
  // ─── Samsung ───────────────────────────────────────────────────────
  '0000F0': 'Samsung', '0007AB': 'Samsung', '000918': 'Samsung', '00095B': 'Samsung',
  '0009DF': 'Samsung', '000AEB': 'Samsung', '001247': 'Samsung', '0012FB': 'Samsung',
  '001377': 'Samsung', '001599': 'Samsung', '0015B9': 'Samsung', '001632': 'Samsung',
  '00166B': 'Samsung', '00166C': 'Samsung', '0016DB': 'Samsung', '0017C9': 'Samsung',
  '0017D5': 'Samsung', '0017E5': 'Samsung', '0018AF': 'Samsung', '001A8A': 'Samsung',
  '001B98': 'Samsung', '001C43': 'Samsung', '001D25': 'Samsung', '001DF6': 'Samsung',
  '001E7D': 'Samsung', '001EE1': 'Samsung', '001EE2': 'Samsung', '001FCC': 'Samsung',
  '001FCD': 'Samsung', '00214C': 'Samsung', '0021D1': 'Samsung', '0021D2': 'Samsung',
  '002339': 'Samsung', '00233A': 'Samsung', '002399': 'Samsung', '0023D6': 'Samsung',
  '0023D7': 'Samsung', '002454': 'Samsung', '002490': 'Samsung', '002491': 'Samsung',
  '0024E9': 'Samsung', '002538': 'Samsung', '002567': 'Samsung', '0025B2': 'Samsung',
  '002637': 'Samsung', '00265D': 'Samsung', '0026E0': 'Samsung', '003018': 'Samsung',
  '00117F': 'Samsung', '0014FC': 'Samsung', '00191A': 'Samsung', '002423': 'Samsung',
  '004098': 'Samsung', '0C4250': 'Samsung', '08007F': 'Samsung', '00385A': 'Samsung',
  '0028F1': 'Samsung', '38B1DB': 'Samsung',
  // ─── Realtek ───────────────────────────────────────────────────────
  '00020E': 'Realtek', '000625': 'Realtek', '000AE2': 'Realtek', '000B6A': 'Realtek',
  '000EE8': 'Realtek', '0013D4': 'Realtek', '0016CE': 'Realtek', '00195B': 'Realtek',
  '001AE9': 'Realtek', '001BFC': 'Realtek', '001D92': 'Realtek', '001FE1': 'Realtek',
  '001FE2': 'Realtek', '002185': 'Realtek', '002186': 'Realtek', '002275': 'Realtek',
  '002401': 'Realtek', '002402': 'Realtek', '002511': 'Realtek', '002522': 'Realtek',
  '002556': 'Realtek', '00262D': 'Realtek', '0050FC': 'Realtek', '008048': 'Realtek',
  '00A0C5': 'Realtek', '00C0A8': 'Realtek', '00E04C': 'Realtek', '00E094': 'Realtek',
  '048D38': 'Realtek', '08606E': 'Realtek', '0C54A5': 'Realtek', '10FEED': 'Realtek',
  '147590': 'Realtek', '148692': 'Realtek', '14C22C': 'Realtek', '14D64D': 'Realtek',
  '18A6F7': 'Realtek', '1C1B68': 'Realtek', '1C5F2B': 'Realtek', '200BC7': 'Realtek',
  '2053CA': 'Realtek', '20858C': 'Realtek', '24050F': 'Realtek', '24615A': 'Realtek',
  '282CB2': 'Realtek', '2C4D54': 'Realtek', '2C56DC': 'Realtek', '30F772': 'Realtek',
  '346AC2': 'Realtek', '3C5282': 'Realtek', '40B034': 'Realtek', '44E9DD': 'Realtek',
  '485B39': 'Realtek', '4C5E0C': 'Realtek', '50465D': 'Realtek', '50A4D0': 'Realtek',
  '525400': 'Realtek', '54880E': 'Realtek', '54A050': 'Realtek', '581FAA': 'Realtek',
  '58946B': 'Realtek', '5C95AE': 'Realtek', '60D819': 'Realtek', '645106': 'Realtek',
  '648D9E': 'Realtek', '681DEF': 'Realtek', '6C4A60': 'Realtek', '7062B8': 'Realtek',
  '7429AF': 'Realtek', '74E14A': 'Realtek', '78929C': 'Realtek', '7C0507': 'Realtek',
  '801F02': 'Realtek', '8030DC': 'Realtek', '80D605': 'Realtek', '84C9B2': 'Realtek',
  '88A6C6': 'Realtek', '8C1645': 'Realtek', '90489A': 'Realtek', '90F1AA': 'Realtek',
  '9401C2': 'Realtek', '9439E5': 'Realtek', '94D029': 'Realtek', '9854E3': 'Realtek',
  '9C54CA': 'Realtek', 'A0E4CB': 'Realtek', 'A4B197': 'Realtek', 'A85E45': 'Realtek',
  'AC1DDF': 'Realtek', 'B05B67': 'Realtek', 'B40B44': 'Realtek', 'B82ADC': 'Realtek',
  'BC9680': 'Realtek', 'C49A02': 'Realtek', 'C89CDC': 'Realtek', 'CC40D0': 'Realtek',
  'D03745': 'Realtek', 'D4016D': 'Realtek', 'D85ED3': 'Realtek', 'DC0EA1': 'Realtek',
  'E04F43': 'Realtek', 'E470B8': 'Realtek', 'E84E06': 'Realtek', 'EC4C4D': 'Realtek',
  'F430B9': 'Realtek', 'F832E4': 'Realtek', 'FC4DD4': 'Realtek', 'FCC233': 'Realtek',
  '00012A': 'Realtek', '0090CC': 'Realtek', '001275': 'Realtek', '00E0E6': 'Realtek',
  '00E0D2': 'Realtek',
  // ─── Broadcom ──────────────────────────────────────────────────────
  '0005B5': 'Broadcom', '000AF7': 'Broadcom', '000DB6': 'Broadcom', '000FE2': 'Broadcom',
  '001018': 'Broadcom', '0014A4': 'Broadcom', '001635': 'Broadcom', '001708': 'Broadcom',
  '001839': 'Broadcom', '00197D': 'Broadcom', '001A73': 'Broadcom', '001BE9': 'Broadcom',
  '001C26': 'Broadcom', '001D60': 'Broadcom', '001E68': 'Broadcom', '001F29': 'Broadcom',
  '002210': 'Broadcom', '002269': 'Broadcom', '00234E': 'Broadcom', '0026F2': 'Broadcom',
  '0050B6': 'Broadcom', '00A0C6': 'Broadcom', '00B78D': 'Broadcom', '00BB3A': 'Broadcom',
  '044BFF': 'Broadcom', '080028': 'Broadcom', '0C473D': 'Broadcom', '101DC0': 'Broadcom',
  '142D27': 'Broadcom', '14B7F8': 'Broadcom', '18C086': 'Broadcom', '1C1448': 'Broadcom',
  '1CB72C': 'Broadcom', '205531': 'Broadcom', '24792A': 'Broadcom', '28C68E': 'Broadcom',
  '2C54CF': 'Broadcom', '3052CB': 'Broadcom', '34BCA6': 'Broadcom', '380197': 'Broadcom',
  '3C5A37': 'Broadcom', '40B395': 'Broadcom', '446D57': 'Broadcom', '48D539': 'Broadcom',
  '4C6641': 'Broadcom', '5070E5': 'Broadcom', '54BD79': 'Broadcom', '58B035': 'Broadcom',
  '5C0A5B': 'Broadcom', '606944': 'Broadcom', '6416F0': 'Broadcom', '6854FD': 'Broadcom',
  '6C2995': 'Broadcom', '7085C2': 'Broadcom', '743E2B': 'Broadcom', '78E8B6': 'Broadcom',
  '7C034C': 'Broadcom', '80AC9C': 'Broadcom', '84A134': 'Broadcom', '889676': 'Broadcom',
  '8C7712': 'Broadcom', '907240': 'Broadcom', '94B86D': 'Broadcom', '980C82': 'Broadcom',
  '9C1E95': 'Broadcom', 'A055DE': 'Broadcom', 'A4C0E1': 'Broadcom', 'A82066': 'Broadcom',
  'AC3B77': 'Broadcom', 'B0C5CA': 'Broadcom', 'B436A9': 'Broadcom', 'B86B23': 'Broadcom',
  'BC6A29': 'Broadcom', 'C0B8B1': 'Broadcom', 'C4017C': 'Broadcom', 'C8FF28': 'Broadcom',
  'CC96A0': 'Broadcom', 'D023DB': 'Broadcom', 'D4A02A': 'Broadcom', 'D8A25E': 'Broadcom',
  'DC0B34': 'Broadcom', 'E03E44': 'Broadcom', 'E47CF9': 'Broadcom', 'E8B2AC': 'Broadcom',
  'EC1A59': 'Broadcom', 'F0407B': 'Broadcom', 'F4032F': 'Broadcom', 'F8633F': 'Broadcom',
  'FC1910': 'Broadcom', 'FCC734': 'Broadcom', '00010E': 'Broadcom', '000D28': 'Broadcom',
  '000E91': 'Broadcom', '0013D2': 'Broadcom', '0017F2': 'Broadcom', '0019E3': 'Broadcom',
  '00902C': 'Broadcom',
  // ─── Qualcomm ──────────────────────────────────────────────────────
  '00037F': 'Qualcomm', '000CE5': 'Qualcomm', '001397': 'Qualcomm', '001A11': 'Qualcomm',
  '001A6A': 'Qualcomm', '001B32': 'Qualcomm', '001D7B': 'Qualcomm', '001E2A': 'Qualcomm',
  '001F3F': 'Qualcomm', '002191': 'Qualcomm', '0022A4': 'Qualcomm', '002496': 'Qualcomm',
  '0025CA': 'Qualcomm', '0026E8': 'Qualcomm', '0050C4': 'Qualcomm', '04BD70': 'Qualcomm',
  '04F938': 'Qualcomm', '08D5C0': 'Qualcomm', '0C45BA': 'Qualcomm', '1008B1': 'Qualcomm',
  '141A51': 'Qualcomm', '149FE8': 'Qualcomm', '182A7B': 'Qualcomm', '1C6F65': 'Qualcomm',
  '205476': 'Qualcomm', '24DBAC': 'Qualcomm', '28C0DA': 'Qualcomm', '2C542D': 'Qualcomm',
  '30469A': 'Qualcomm', '3428F0': 'Qualcomm', '34E71C': 'Qualcomm', '38AD8E': 'Qualcomm',
  '3C9157': 'Qualcomm', '40B4F0': 'Qualcomm', '44D9E7': 'Qualcomm', '4827EA': 'Qualcomm',
  '4C72B9': 'Qualcomm', '505065': 'Qualcomm', '546009': 'Qualcomm', '58A2B5': 'Qualcomm',
  '5C5188': 'Qualcomm', '603197': 'Qualcomm', '649C81': 'Qualcomm', '6854E5': 'Qualcomm',
  '6C71D9': 'Qualcomm', '702E22': 'Qualcomm', '74D02B': 'Qualcomm', '78DAB3': 'Qualcomm',
  '7C11CB': 'Qualcomm', '806AB0': 'Qualcomm', '845DD7': 'Qualcomm', '88E3AB': 'Qualcomm',
  '8C59C3': 'Qualcomm', '9078B2': 'Qualcomm', '94D859': 'Qualcomm', '98F058': 'Qualcomm',
  '9C305B': 'Qualcomm', 'A002DC': 'Qualcomm', 'A40DBC': 'Qualcomm', 'A8FAD8': 'Qualcomm',
  'AC3A7A': 'Qualcomm', 'B0AA77': 'Qualcomm', 'B4CEFE': 'Qualcomm', 'B8F934': 'Qualcomm',
  'BC60A7': 'Qualcomm', 'C0D012': 'Qualcomm', 'C40415': 'Qualcomm', 'C80258': 'Qualcomm',
  'CC7D37': 'Qualcomm', 'D05349': 'Qualcomm', 'D4612E': 'Qualcomm', 'D8B377': 'Qualcomm',
  'DC38E1': 'Qualcomm', 'E0CBBC': 'Qualcomm', 'E4A7A0': 'Qualcomm', 'E8BBA8': 'Qualcomm',
  'EC888F': 'Qualcomm', 'F02765': 'Qualcomm', 'F450EB': 'Qualcomm', 'F80CF3': 'Qualcomm',
  'FC1794': 'Qualcomm', 'FCC2DE': 'Qualcomm', '000274': 'Qualcomm', '000390': 'Qualcomm',
  '000542': 'Qualcomm', '000636': 'Qualcomm', '000854': 'Qualcomm', '000B2A': 'Qualcomm',
  '000C9F': 'Qualcomm', '000C1D': 'Qualcomm',
  // ─── Cisco / Linksys ───────────────────────────────────────────────
  '00045A': 'Cisco-Linksys', '000C41': 'Cisco-Linksys', '000E08': 'Cisco-Linksys',
  '000F66': 'Cisco-Linksys', '001217': 'Cisco-Linksys', '001310': 'Cisco-Linksys',
  '0016B6': 'Cisco-Linksys', '0018F8': 'Cisco-Linksys', '001A70': 'Cisco-Linksys',
  '001C10': 'Cisco-Linksys', '001D7E': 'Cisco-Linksys', '001EE5': 'Cisco-Linksys',
  '002129': 'Cisco-Linksys', '00226B': 'Cisco-Linksys', '002369': 'Cisco-Linksys',
  '00259C': 'Cisco-Linksys', '0025B4': 'Cisco-Linksys', '003192': 'Cisco-Linksys',
  '005F86': 'Cisco-Linksys', '04214C': 'Cisco-Linksys', '046273': 'Cisco-Linksys',
  '086698': 'Cisco-Linksys', '0C6803': 'Cisco-Linksys', '102D96': 'Cisco-Linksys',
  '14DAE9': 'Cisco-Linksys', '185933': 'Cisco-Linksys', '1C6A7A': 'Cisco-Linksys',
  '203A07': 'Cisco-Linksys', '2401C7': 'Cisco-Linksys', '28BE03': 'Cisco-Linksys',
  '2C3ECF': 'Cisco-Linksys', '302303': 'Cisco-Linksys', '347A60': 'Cisco-Linksys',
  '38229D': 'Cisco-Linksys', '3C08F6': 'Cisco-Linksys', '404022': 'Cisco-Linksys',
  '44ADD9': 'Cisco-Linksys', '48F8B3': 'Cisco-Linksys', '4CA64D': 'Cisco-Linksys',
  '5065F3': 'Cisco-Linksys', '5404A6': 'Cisco-Linksys', '586D8F': 'Cisco-Linksys',
  '5CA39D': 'Cisco-Linksys', '60FE20': 'Cisco-Linksys', '687F74': 'Cisco-Linksys',
  '6C198F': 'Cisco-Linksys', '743170': 'Cisco-Linksys', '7898FD': 'Cisco-Linksys',
  '7C0ECE': 'Cisco-Linksys', '802689': 'Cisco-Linksys', '841B5E': 'Cisco-Linksys',
  '881544': 'Cisco-Linksys', '8C604F': 'Cisco-Linksys', '903AA0': 'Cisco-Linksys',
  '94103E': 'Cisco-Linksys', '980EE4': 'Cisco-Linksys', '9C4FDA': 'Cisco-Linksys',
  'A06391': 'Cisco-Linksys', 'A4A24A': 'Cisco-Linksys', 'A89B10': 'Cisco-Linksys',
  'AC6B0F': 'Cisco-Linksys', 'B06394': 'Cisco-Linksys', 'B4750E': 'Cisco-Linksys',
  'B83861': 'Cisco-Linksys', 'BC0543': 'Cisco-Linksys', 'C05627': 'Cisco-Linksys',
  'C40142': 'Cisco-Linksys', 'C83A35': 'Cisco-Linksys', 'CC08FB': 'Cisco-Linksys',
  'D0D0FD': 'Cisco-Linksys', 'D46D50': 'Cisco-Linksys', 'D85DFB': 'Cisco-Linksys',
  'DC5360': 'Cisco-Linksys', 'E0469A': 'Cisco-Linksys', 'E49E12': 'Cisco-Linksys',
  'E8BA70': 'Cisco-Linksys', 'EC4476': 'Cisco-Linksys', 'F07F06': 'Cisco-Linksys',
  'F49FF3': 'Cisco-Linksys', 'F81037': 'Cisco-Linksys', 'FC7516': 'Cisco-Linksys',
  '001D5E': 'Cisco-Linksys',
  // ─── Microsoft ─────────────────────────────────────────────────────
  '0003FF': 'Microsoft', '00125A': 'Microsoft', '0017FA': 'Microsoft',
  '002248': 'Microsoft', '0025AE': 'Microsoft', '0050F2': 'Microsoft',
  '281878': 'Microsoft', '3059B7': 'Microsoft', '37D3B8': 'Microsoft',
  '3C8375': 'Microsoft', '404D7F': 'Microsoft', '448A5B': 'Microsoft',
  '4C0BBE': 'Microsoft', '501AC5': 'Microsoft', '6045BD': 'Microsoft',
  '607EDD': 'Microsoft', '643150': 'Microsoft', '689C70': 'Microsoft',
  '701CE7': 'Microsoft', '74E2F5': 'Microsoft', '7C1E52': 'Microsoft',
  '80C5E6': 'Microsoft', '8463D6': 'Microsoft', '985FD3': 'Microsoft',
  'A0E9DB': 'Microsoft', 'A4516F': 'Microsoft', 'A89DD2': 'Microsoft',
  'B831B5': 'Microsoft', 'BC8385': 'Microsoft', 'C0335E': 'Microsoft',
  'C43ABE': 'Microsoft', 'C83F26': 'Microsoft', 'D00790': 'Microsoft',
  'D48F5A': 'Microsoft', 'DCB4C4': 'Microsoft', 'E0D9E3': 'Microsoft',
  'E498D6': 'Microsoft', 'E8508B': 'Microsoft', 'EC59E7': 'Microsoft',
  'F06E0B': 'Microsoft', 'F4F1E1': 'Microsoft', 'F80F41': 'Microsoft',
  'FC0F4B': 'Microsoft', '001251': 'Microsoft',
  // ─── Raspberry Pi ──────────────────────────────────────────────────
  'B827EB': 'Raspberry Pi', 'DCA632': 'Raspberry Pi', 'E45F01': 'Raspberry Pi',
  '2C265F': 'Raspberry Pi', '28CD1C': 'Raspberry Pi', '28CDC1': 'Raspberry Pi',
  '28CDC4': 'Raspberry Pi', '28CDA7': 'Raspberry Pi', 'DC7E14': 'Raspberry Pi',
  'E45F02': 'Raspberry Pi', 'B8279F': 'Raspberry Pi', 'B8271A': 'Raspberry Pi',
  '28CD97': 'Raspberry Pi',
  // ─── ASUS / OpenWrt ────────────────────────────────────────────────
  '001124': 'ASUS', '0011D8': 'ASUS', '001731': 'ASUS', '0018F3': 'ASUS',
  '001A92': 'ASUS', '001E8C': 'ASUS', '002215': 'ASUS', '00248C': 'ASUS',
  '002618': 'ASUS', '04421A': 'ASUS', '049226': 'ASUS', '0C9D92': 'ASUS',
  '107B44': 'ASUS', '10BF48': 'ASUS', '10C37B': 'ASUS', '14DDA9': 'ASUS',
  '1831BF': 'ASUS', '1C872C': 'ASUS', '20CF30': 'ASUS', '244BFE': 'ASUS',
  '2CFDA1': 'ASUS', '3085A9': 'ASUS', '3497F6': 'ASUS', '382C4A': 'ASUS',
  '38D547': 'ASUS', '3C7C3F': 'ASUS', '40167E': 'ASUS', '40B076': 'ASUS',
  '581122': 'ASUS', '5C338E': 'ASUS', '6045CB': 'ASUS', '60A44C': 'ASUS',
  '60CF84': 'ASUS', '681729': 'ASUS', '704D7B': 'ASUS', '708BCD': 'ASUS',
  '7824AF': 'ASUS', '7C10C9': 'ASUS', '88D7F6': 'ASUS', '90E6BA': 'ASUS',
  '94DBC9': 'ASUS', '9C5C8E': 'ASUS', 'A036BC': 'ASUS', 'AC220B': 'ASUS',
  'AC9E17': 'ASUS', 'B06EBF': 'ASUS', 'B4FBF9': 'ASUS', 'BC1665': 'ASUS',
  'BC5FF4': 'ASUS', 'C06118': 'ASUS', 'C46516': 'ASUS', 'C86000': 'ASUS',
  'CC28AA': 'ASUS', 'D017C2': 'ASUS', 'D45D64': 'ASUS', 'D850E6': 'ASUS',
  'DCCEC1': 'ASUS', 'E03F49': 'ASUS', 'E0CB4E': 'ASUS', 'E865D4': 'ASUS',
  'F07959': 'ASUS', 'F46D04': 'ASUS', 'FC3497': 'ASUS', '000EA6': 'ASUS',
  '0040F2': 'ASUS', '001214': 'ASUS',
  // ─── HP / HPE ──────────────────────────────────────────────────────
  '0014C2': 'Hewlett-Packard', '0090FB': 'Hewlett-Packard', '0060B0': 'Hewlett-Packard',
  '0008C7': 'Hewlett-Packard', '0010E6': 'Hewlett-Packard', '00508B': 'Hewlett-Packard',
  '00601D': 'Hewlett-Packard', '00C0B7': 'Hewlett-Packard', '045468': 'Hewlett-Packard',
  '006016': 'Hewlett-Packard',
  // ─── Juniper ───────────────────────────────────────────────────────
  '000585': 'Juniper', '000FCA': 'Juniper', '001139': 'Juniper', '001F12': 'Juniper',
  '002688': 'Juniper', '002BCA': 'Juniper', '00E0CC': 'Juniper', '2C6B8E': 'Juniper',
  '3CB11F': 'Juniper', '6C7E6D': 'Juniper', '7CDA85': 'Juniper', '841F4F': 'Juniper',
  'C0272A': 'Juniper',
  // ─── Arista ────────────────────────────────────────────────────────
  '001C73': 'Arista', '0CC2DA': 'Arista', '1C705B': 'Arista', '24E923': 'Arista',
  '48BF6B': 'Arista', '68EF7C': 'Arista', '98BE94': 'Arista', 'A4BADB': 'Arista',
  'B8BADB': 'Arista', 'CC46D6': 'Arista',
  // ─── Fortinet ──────────────────────────────────────────────────────
  '0009F0': 'Fortinet', '001831': 'Fortinet', '00B080': 'Fortinet', '02D5CE': 'Fortinet',
  '085B1E': 'Fortinet', '704CA5': 'Fortinet', 'C00C5C': 'Fortinet', 'D0271B': 'Fortinet',
  // ─── Palo Alto ─────────────────────────────────────────────────────
  '00868C': 'Palo Alto', '0086F8': 'Palo Alto', '0CEEE5': 'Palo Alto',
  '1438A4': 'Palo Alto', '4C9913': 'Palo Alto', '88E213': 'Palo Alto',
  // ─── F5 ────────────────────────────────────────────────────────────
  '009027': 'F5', '0013E0': 'F5', '002103': 'F5', '00601A': 'F5', 'A4CDD8': 'F5',
  // ─── Brocade ───────────────────────────────────────────────────────
  '00051E': 'Brocade', '00052B': 'Brocade', '00604F': 'Brocade', '0060B9': 'Brocade',
  '00C0DD': 'Brocade', '5002C9': 'Brocade',
  // ─── Aruba (HPE) ───────────────────────────────────────────────────
  '000B86': 'Aruba', '001A1E': 'Aruba', '00900A': 'Aruba', '00B486': 'Aruba',
  '0C38BA': 'Aruba', '20088F': 'Aruba', '24DEC6': 'Aruba', '38F9D3': 'Aruba',
  // ─── ZTE ───────────────────────────────────────────────────────────
  '00E042': 'ZTE', '00E0B4': 'ZTE', '00E0FC': 'ZTE', '001C05': 'ZTE',
  'D46129': 'ZTE', 'C00814': 'ZTE', 'F4B8A7': 'ZTE', '6C3BF7': 'ZTE',
  'ACD5C8': 'ZTE', '3408CB': 'ZTE',
  // ─── MikroTik ──────────────────────────────────────────────────────
  '000C42': 'MikroTik', '001544': 'MikroTik', '0016F0': 'MikroTik', '001955': 'MikroTik',
  '001BCC': 'MikroTik', '0021F6': 'MikroTik', '002A39': 'MikroTik', '002828': 'MikroTik',
  // ─── Ubiquiti ──────────────────────────────────────────────────────
  '00049F': 'Ubiquiti', '00051A': 'Ubiquiti', '00041E': 'Ubiquiti', '0004B2': 'Ubiquiti',
  '0004E0': 'Ubiquiti', '0004E3': 'Ubiquiti', '0004E4': 'Ubiquiti', '0004E5': 'Ubiquiti',
  '0004ED': 'Ubiquiti', '001E58': 'Ubiquiti',
  // ─── Sony ──────────────────────────────────────────────────────────
  '000483': 'Sony', '000930': 'Sony', '001060': 'Sony', '001216': 'Sony',
  '001A41': 'Sony', '001C45': 'Sony', '00E041': 'Sony', '5CF78E': 'Sony',
  'D4A3E9': 'Sony',
  // ─── LG ────────────────────────────────────────────────────────────
  '001F6A': 'LG', '001E75': 'LG', '0050C2': 'LG', '008047': 'LG',
  '04C123': 'LG', '0C1D68': 'LG', '14A992': 'LG', '180831': 'LG',
  '247670': 'LG', '34A33E': 'LG', 'A04E04': 'LG', 'B8A386': 'LG', 'C44AC0': 'LG',
  // ─── Nintendo ──────────────────────────────────────────────────────
  '0009BF': 'Nintendo', '00120F': 'Nintendo', '001B7A': 'Nintendo', '001BEA': 'Nintendo',
  '001E35': 'Nintendo', '001E9C': 'Nintendo', '00235D': 'Nintendo', '002508': 'Nintendo',
  // ─── Microsoft (Xbox) ──────────────────────────────────────────────
  '0C3558': 'Microsoft (Xbox)', '206591': 'Microsoft (Xbox)', '283926': 'Microsoft (Xbox)',
  '40B388': 'Microsoft (Xbox)', '484848': 'Microsoft (Xbox)', '8853D0': 'Microsoft (Xbox)',
  'A4D044': 'Microsoft (Xbox)',
  // ─── Valve ─────────────────────────────────────────────────────────
  '00503F': 'Valve', '005070': 'Valve', 'F0E0B0': 'Valve', '080059': 'Valve',
  // ─── OnePlus ───────────────────────────────────────────────────────
  '0088E0': 'OnePlus', '08536E': 'OnePlus', '14EB1C': 'OnePlus', '28108B': 'OnePlus',
  '385225': 'OnePlus', '5448E6': 'OnePlus', '6840C4': 'OnePlus', '9CF357': 'OnePlus',
  'A4238A': 'OnePlus',
  // ─── Oppo ──────────────────────────────────────────────────────────
  '00105E': 'Oppo', '00284A': 'Oppo', '084646': 'Oppo', '0C3741': 'Oppo',
  '283638': 'Oppo', '345921': 'Oppo', '447317': 'Oppo', '646E6E': 'Oppo', '84225D': 'Oppo',
  // ─── Vivo ──────────────────────────────────────────────────────────
  '00102A': 'Vivo', '0868C0': 'Vivo', '100665': 'Vivo', '247824': 'Vivo',
  '547895': 'Vivo', '60A4B0': 'Vivo', '747052': 'Vivo', '8C8226': 'Vivo', 'B4E842': 'Vivo',
  // ─── Motorola ──────────────────────────────────────────────────────
  '001C9A': 'Motorola', '001E45': 'Motorola', '002267': 'Motorola', '00401A': 'Motorola',
  '005022': 'Motorola', '006014': 'Motorola', '009058': 'Motorola', '00C05A': 'Motorola',
  // ─── Nokia ─────────────────────────────────────────────────────────
  '000141': 'Nokia', '000BF0': 'Nokia', '0014D6': 'Nokia', '0022F5': 'Nokia',
  '00504B': 'Nokia', '00904C': 'Nokia', '00C0DF': 'Nokia', '0C7AB3': 'Nokia',
  // ─── BlackBerry ────────────────────────────────────────────────────
  '000C30': 'BlackBerry', '0018AA': 'BlackBerry', '001F35': 'BlackBerry', '00270F': 'BlackBerry',
  '002A06': 'BlackBerry', '0040D0': 'BlackBerry', '006057': 'BlackBerry', '009009': 'BlackBerry',
  // ─── MediaTek ──────────────────────────────────────────────────────
  '0001C0': 'MediaTek', '0003F5': 'MediaTek', '000E7B': 'MediaTek', '001199': 'MediaTek',
  '0012B3': 'MediaTek', '001393': 'MediaTek',
  // ─── Marvell ───────────────────────────────────────────────────────
  '000250': 'Marvell', '000389': 'Marvell', '00064B': 'Marvell', '000768': 'Marvell',
  '0008B7': 'Marvell', '0009F3': 'Marvell',
  // ─── NVIDIA ────────────────────────────────────────────────────────
  '000BAA': 'NVIDIA', '0040F4': 'NVIDIA', '0040F5': 'NVIDIA', '005066': 'NVIDIA',
  '0060CC': 'NVIDIA', '00E01E': 'NVIDIA', '040234': 'NVIDIA', '089268': 'NVIDIA',
  // ─── AMD ───────────────────────────────────────────────────────────
  '000095': 'AMD', '00106B': 'AMD', '00105A': 'AMD', '0012D4': 'AMD',
  '001861': 'AMD', '00224E': 'AMD',
  // ─── Arduino ───────────────────────────────────────────────────────
  '90A2DA': 'Arduino', '0090A2': 'Arduino', '00809F': 'Arduino', '000319': 'Arduino',
  'F8F005': 'Arduino',
  // ─── Tuya ──────────────────────────────────────────────────────────
  '102030': 'Tuya', 'D8F027': 'Tuya', 'D4F22B': 'Tuya', '104B7A': 'Tuya',
  '500679': 'Tuya', '68549F': 'Tuya', '747346': 'Tuya', '84C704': 'Tuya',
  '94C937': 'Tuya', 'C4DD57': 'Tuya', 'D0EAE9': 'Tuya', 'E04312': 'Tuya',
  // ─── Espressif (ESP32) ─────────────────────────────────────────────
  '240AC4': 'Espressif (ESP32)', '24B2DE': 'Espressif (ESP32)', '2462AB': 'Espressif (ESP32)',
  '300AE4': 'Espressif (ESP32)', '246F28': 'Espressif (ESP32)', '248C07': 'Espressif (ESP32)',
  '24D7EB': 'Espressif (ESP32)', '2C3AE5': 'Espressif (ESP32)', '3CE045': 'Espressif (ESP32)',
  '40F520': 'Espressif (ESP32)', '44178B': 'Espressif (ESP32)', '483FDA': 'Espressif (ESP32)',
  '4C11BF': 'Espressif (ESP32)', '5002F9': 'Espressif (ESP32)', '54A604': 'Espressif (ESP32)',
  '58BF25': 'Espressif (ESP32)', '5C5CF1': 'Espressif (ESP32)', '6055F9': 'Espressif (ESP32)',
  '686A24': 'Espressif (ESP32)', '70B840': 'Espressif (ESP32)',
  // ─── Netgear ───────────────────────────────────────────────────────
  '00146C': 'Netgear', '001B2F': 'Netgear', '001F33': 'Netgear', '0024B2': 'Netgear',
  '000FB5': 'Netgear', '0090F5': 'Netgear',
  // ─── D-Link ────────────────────────────────────────────────────────
  '001CC4': 'D-Link', '00055D': 'D-Link', '000D88': 'D-Link', '000F3D': 'D-Link',
  '001195': 'D-Link', '0011F0': 'D-Link',
  // ─── Belkin ────────────────────────────────────────────────────────
  '001150': 'Belkin', '00173F': 'Belkin', '003074': 'Belkin', '006022': 'Belkin',
  '0C61CF': 'Belkin', '941032': 'Belkin', 'C8F26E': 'Belkin',
  // ─── Tenda ─────────────────────────────────────────────────────────
  '047960': 'Tenda', '0C72D7': 'Tenda', '1466E6': 'Tenda', '1CFA68': 'Tenda',
  '280740': 'Tenda', '3027C7': 'Tenda', '34C0F2': 'Tenda', '4407A2': 'Tenda',
  // ─── Canon ─────────────────────────────────────────────────────────
  '001841': 'Canon', '00085E': 'Canon', '001032': 'Canon', '001E8F': 'Canon',
  '002036': 'Canon', '002148': 'Canon',
  // ─── Epson ─────────────────────────────────────────────────────────
  '0000E8': 'Epson', '00046B': 'Epson', '00086B': 'Epson', '000920': 'Epson',
  '000B0C': 'Epson', '000F8E': 'Epson', '00100B': 'Epson', '001141': 'Epson',
  '001331': 'Epson',
  // ─── Brother ───────────────────────────────────────────────────────
  '000109': 'Brother', '000221': 'Brother', '000370': 'Brother', '000584': 'Brother',
  '000685': 'Brother', '000786': 'Brother', '000887': 'Brother',
  // ─── Xerox ─────────────────────────────────────────────────────────
  '0000AA': 'Xerox', '0080F0': 'Xerox', '080020': 'Xerox',
  // ─── Western Digital ───────────────────────────────────────────────
  '00022B': 'Western Digital', '001095': 'Western Digital', '0014EE': 'Western Digital',
  '001B6F': 'Western Digital', '001C4D': 'Western Digital', '001E4B': 'Western Digital',
  '00205E': 'Western Digital', '002411': 'Western Digital', '002699': 'Western Digital',
  // ─── Seagate ───────────────────────────────────────────────────────
  '001075': 'Seagate', '001282': 'Seagate', '00141B': 'Seagate', '001837': 'Seagate',
  '002009': 'Seagate', '002236': 'Seagate',
  // ─── Synology ──────────────────────────────────────────────────────
  '001122': 'Synology', '0012F8': 'Synology', '001876': 'Synology',
  '0019A0': 'Synology', '001A4B': 'Synology',
  // ─── QNAP ──────────────────────────────────────────────────────────
  '00079B': 'QNAP', '000941': 'QNAP', '000E9F': 'QNAP', '001001': 'QNAP',
  '0010C3': 'QNAP', '001243': 'QNAP', '001314': 'QNAP', '001463': 'QNAP',
  '001572': 'QNAP', '0016B3': 'QNAP',
  // ─── Lenovo ────────────────────────────────────────────────────────
  '001125': 'Lenovo', '001925': 'Lenovo', '00A098': 'Lenovo', '5C8266': 'Lenovo',
  '6C0B84': 'Lenovo', 'D07E35': 'Lenovo',
  // ─── Acer ──────────────────────────────────────────────────────────
  '00112F': 'Acer', '00141C': 'Acer', '00161D': 'Acer', '001F75': 'Acer',
  '002484': 'Acer', '0CB538': 'Acer',
  // ─── MSI ───────────────────────────────────────────────────────────
  '000C76': 'MSI', '001365': 'MSI', '003037': 'MSI', 'F4624F': 'MSI', 'D4941E': 'MSI',
  // ─── Gigabyte ──────────────────────────────────────────────────────
  '0016E6': 'Gigabyte', '001D7D': 'Gigabyte', '0021ED': 'Gigabyte', '04D92A': 'Gigabyte',
  '0CEC14': 'Gigabyte',
  // ─── Toshiba ───────────────────────────────────────────────────────
  '000825': 'Toshiba', '001123': 'Toshiba', '00A040': 'Toshiba', '00C0A0': 'Toshiba',
  // ─── Supermicro ────────────────────────────────────────────────────
  '00307F': 'Supermicro', '00256E': 'Supermicro', '0CC754': 'Supermicro',
  '00A064': 'Supermicro', '3C7232': 'Supermicro',
  // ─── Google ────────────────────────────────────────────────────────
  '00D0D0': 'Google', 'FCEE66': 'Google', '3C5AB4': 'Google',
};

const normalizeOUI = (input: string): string => {
  return input.replace(/[:.\- ]/g, '').toUpperCase().slice(0, 6);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const oui = normalizeOUI(input.trim());
      if (!/^[0-9A-F]{6}$/.test(oui)) {
        throw new Error('请输入 MAC 前 3 字节 (6 位十六进制)');
      }
      const vendor = OUI_DB[oui];
      if (vendor) {
        return [
          `OUI: ${oui.slice(0, 2)}:${oui.slice(2, 4)}:${oui.slice(4, 6)}`,
          `厂商: ${vendor}`,
        ].join('\n');
      }
      return [
        `OUI: ${oui.slice(0, 2)}:${oui.slice(2, 4)}:${oui.slice(4, 6)}`,
        `厂商: 未知 (不在本地数据库中)`,
        ``,
        `可前往 https://standards-oui.ieee.org/oui/oui.txt 查询完整 OUI 数据库`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
