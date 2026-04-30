import os
import json
import csv
import time
import requests

# Load .env file
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

load_env()

BASE_URL = os.environ.get('OLSERA_BASE_URL', 'https://api-open.olsera.co.id/api/open-api/v1/id')
APP_ID = os.environ.get('OLSERA_APP_ID', '')
SECRET_KEY = os.environ.get('OLSERA_SECRET_KEY', '')

cached_token = None
cached_refresh_token = None

def get_token():
    global cached_token, cached_refresh_token

    if cached_token and time.time() < cached_token['expires_at']:
        return cached_token['token']

    # Try refresh token
    if cached_refresh_token:
        try:
            resp = requests.post(
                BASE_URL + '/token',
                data={'refresh_token': cached_refresh_token, 'grant_type': 'refresh_token'},
                headers={'Accept': 'application/json'}
            )
            if resp.status_code == 200:
                result = resp.json()
                if result.get('access_token'):
                    cached_token = {
                        'token': result['access_token'],
                        'expires_at': time.time() + (result['expires_in'] - 60)
                    }
                    if result.get('refresh_token'):
                        cached_refresh_token = result['refresh_token']
                    return cached_token['token']
        except:
            pass

    # Get new token
    resp = requests.post(
        BASE_URL + '/token',
        data={'app_id': APP_ID, 'secret_key': SECRET_KEY, 'grant_type': 'secret_key'},
        headers={'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'}
    )
    if resp.status_code != 200:
        raise Exception('Token failed: ' + str(resp.status_code) + ' ' + resp.text[:200])
    result = resp.json()
    if not result.get('access_token'):
        raise Exception('No access_token: ' + resp.text[:200])
    cached_token = {
        'token': result['access_token'],
        'expires_at': time.time() + (result['expires_in'] - 60)
    }
    if result.get('refresh_token'):
        cached_refresh_token = result['refresh_token']
    return cached_token['token']

def api_get(path):
    token = get_token()
    url = BASE_URL + path
    resp = requests.get(
        url,
        headers={'Accept': 'application/json', 'Authorization': 'Bearer ' + token}
    )
    if resp.status_code != 200:
        raise Exception('API ' + str(resp.status_code) + ': ' + resp.text[:200])
    return resp.json()

def fetch_all_products():
    page = 1
    per_page = 100
    last_page = 1
    all_products = []

    while True:
        print('Fetching page ' + str(page) + '...')
        json_data = api_get('/product?page=' + str(page) + '&per_page=' + str(per_page))
        products = json_data.get('data', [])
        all_products.extend(products)
        last_page = json_data.get('meta', {}).get('last_page', page)
        page += 1
        if page > last_page:
            break

    return all_products

def clean_url(url):
    """Remove no_data_item URLs, return empty if useless."""
    if not url:
        return ''
    if 'no_data_item' in url:
        return ''
    return url

def get_image_url(variant, parent):
    """Get best image: variant → parent → empty (skip no_data_item)."""
    img = clean_url(variant.get('photo_md', ''))
    if img:
        return img
    return clean_url(parent.get('photo_md', ''))

def expand_products(parents):
    rows = []

    for parent in parents:
        has_variant = parent.get('has_variant', 0) > 0
        variants = parent.get('variants') or []

        if has_variant and len(variants) > 0:
            for v in variants:
                image_url = get_image_url(v, parent)
                rows.append({
                    'id': str(v['id']),
                    'olsera_product_id': str(v['id']),
                    'parent_id': str(parent['id']),
                    'parent_name': parent['name'],
                    'name': parent['name'] + ' - ' + v['name'],
                    'sku': v.get('sku', '') or '',
                    'category': parent.get('klasifikasi', '') or parent.get('category_name', '') or 'Uncategorized',
                    'brand_name': parent.get('brand_name', '') or '',
                    'klasifikasi': parent.get('klasifikasi', '') or '',
                    'price': round(float(v.get('sell_price_pos', 0) or 0)),
                    'buy_price': round(float(v.get('buy_price', 0) or 0)),
                    'stock': int(float(v.get('stock_qty', 0) or 0)),
                    'image_url': image_url,
                    'description': parent.get('description', '') or '',
                    'published': parent.get('published', 1),
                    'pos_hidden': parent.get('pos_hidden', 0),
                    'has_variant': 1,
                    'is_variant': 'YES',
                    'variant_name': v['name'],
                    'variant_sku': v.get('sku', '') or '',
                    'variant_stock': int(float(v.get('stock_qty', 0) or 0)),
                    'variant_price': round(float(v.get('sell_price_pos', 0) or 0)),
                })
        else:
            image_url = clean_url(parent.get('photo_md', ''))
            rows.append({
                'id': str(parent['id']),
                'olsera_product_id': str(parent['id']),
                'parent_id': str(parent['id']),
                'parent_name': parent['name'],
                'name': parent['name'],
                'sku': parent.get('sku', '') or '',
                'category': parent.get('klasifikasi', '') or parent.get('category_name', '') or 'Uncategorized',
                'brand_name': parent.get('brand_name', '') or '',
                'klasifikasi': parent.get('klasifikasi', '') or '',
                'price': round(float(parent.get('sell_price_pos', 0) or 0)),
                'buy_price': round(float(parent.get('buy_price', 0) or 0)),
                'stock': int(float(parent.get('stock_qty', 0) or 0)),
                'image_url': image_url,
                'description': parent.get('description', '') or '',
                'published': parent.get('published', 1),
                'pos_hidden': parent.get('pos_hidden', 0),
                'has_variant': 0,
                'is_variant': 'NO',
                'variant_name': '',
                'variant_sku': '',
                'variant_stock': 0,
                'variant_price': 0,
            })

    return rows

def main():
    print('Fetching products from Olsera API...')
    parents = fetch_all_products()
    print('Got ' + str(len(parents)) + ' parent products')

    expanded = expand_products(parents)
    print('Expanded to ' + str(len(expanded)) + ' rows (with variants)')

    with_image = sum(1 for r in expanded if r['image_url'])
    no_image = len(expanded) - with_image
    print('Products with image: ' + str(with_image))
    print('Products without image: ' + str(no_image))

    # Write CSV
    export_dir = os.path.join(os.path.dirname(__file__), '..', 'export')
    if not os.path.exists(export_dir):
        os.makedirs(export_dir)
    csv_path = os.path.join(export_dir, 'olsera-products-' + str(int(time.time())) + '.csv')

    headers = [
        'id', 'olsera_product_id', 'parent_id', 'parent_name',
        'name', 'sku', 'category', 'brand_name', 'klasifikasi',
        'price', 'buy_price', 'stock',
        'image_url', 'description',
        'published', 'pos_hidden',
        'has_variant', 'is_variant',
        'variant_name', 'variant_sku', 'variant_stock', 'variant_price',
    ]

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(expanded)

    print('CSV exported to: ' + csv_path)
    print('Total rows: ' + str(len(expanded)))

if __name__ == '__main__':
    main()
