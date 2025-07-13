
# BACKEND

## AUTH ENDPOINTS

#### SIGN-IN

```http
  POST /api/auth/sign-in
```

| Parametre | Tip     | Açıklama                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |
| `password` | `string` | **Gerekli**. Min-Max 6-64 |

Eğer 2fa aktif ise Aşşağıdaki Gibi Response Döner
```example
  {success: true, message:"2FAREQUIRED", {username: "testuser"}}
```

#### SIGN-IN (STEP-TWO FOR 2FA)

```http
  POST /api/auth/2fa/login
```

| Parametre | Tip     | Açıklama                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |
| `OTP` | `number` | **Gerekli**. Min-Max 6-64 |

#### SIGN-UP

```http
  POST /api/auth/sign-up
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Gerekli**. |
| `username`      | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |
| `password` | `string` | **Gerekli**. Min-Max 6-64 |


#### LOGOUT

```http
  GET /api/auth/logout
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `access_token`      | `string` | **Gerekli**. Login Sonrası Cookiede Saklanır!|

#### GOOGLE LOGIN (REMOTE AUTH)

```http
  GET /api/auth/login/google
```

#### PASSWORD UPDATE

```http
  GET /api/auth/logout
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `access_token`      | `string` | **Gerekli**. Login Sonrası Cookiede Saklanır!|




## USER ENDPOINTS (JWT REQUIRED)

#### PROFILE

```http
  GET /api/user/profile
```
#### CHANGE PASSWORD

```http
  POST /api/user/password
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `password`      | `string` | **Gerekli**. Min-Max 6-64|
| `new_password`      | `string` | **Gerekli**. Min-Max 6-64|
| `new_re_password`      | `string` | **Gerekli**. Min-Max 6-64|
| `user_id`      | `number` | **ADMIN için**. Min  1|

#### SET 2FA

```http
  POST /api/auth/2fa/set2FA
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `t2type`      | `boolean` | **Gerekli**.|

Başarılı ise aşşağıdaki gibi response döner ve verify bekler
```example
  {success: true, message:"OTP sent successfully"}
```

#### 2FA VERIFY (FOR SET)

```http
  POST /api/auth/2fa/set2FA/verify
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `OTP`      | `number` | **Gerekli**.|


#### LIST FRIENDS

```http
  GET /api/user/friends
```

#### FRIENDS DETAILS

```http
  POST /api/user/friends/details
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `friends`      | `array[number]` | **Gerekli**. Min  1|

#### LIST FRIENDS

```http
  POST /api/user/friends/details
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `friends`      | `array[number]` | **Gerekli**. Min  1|

#### FRIEND REQUEST

```http
  POST /api/user/friends/request
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `friend_id`      | `number` | **Gerekli**|
| `request_type`      | `enum string` | **Gerekli**. "Pending" - "Accepted" - "Remove"|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|



#### BLOCK USER

```http
  POST /api/user/friends/block
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `blocked_id`      | `number` | **Gerekli**|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|

#### LIST BLOCKED USER

```http
  GET /api/user/friends/block
```

#### UNBLOCK USER

```http
  POST /api/user/friends/unblock
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `blocked_id`      | `number` | **Gerekli**|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|


## ADMIN ENDPOINTS (JWT REQUIRED - ROLE REQUIRED)

#### FRIEND REQUEST

```http
  POST /api/user/friends/request
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `newRole`      | `number` | **Gerekli**|
| `request_type`      | `enum string` | **Gerekli**. "USER" - "ADMIN"|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|
