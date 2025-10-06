```vue
<template>
  <div class="container mt-5">
    <h2>Дефекты проекта #{{ $route.params.projectId }}</h2>

    <!-- Кнопка возврата -->
    <button class="btn btn-secondary mb-4" @click="goBack">Вернуться к проектам</button>

    <!-- Форма создания дефекта -->
    <h3>Добавить дефект</h3>
    <form @submit.prevent="createDefect">
      <div class="mb-3">
        <label for="defectDescription" class="form-label">Описание дефекта</label>
        <textarea
          class="form-control"
          id="defectDescription"
          v-model.trim="defectDescription"
          placeholder="Введите описание дефекта"
          required
        ></textarea>
      </div>
      <div class="mb-3">
        <label for="defectPriority" class="form-label">Приоритет</label>
        <select
          class="form-control"
          id="defectPriority"
          v-model="defectPriority"
          required
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="defectStatus" class="form-label">Статус</label>
        <select
          class="form-control"
          id="defectStatus"
          v-model="defectStatus"
          required
        >
          <option value="new">Новый</option>
          <option value="in_work">В работе</option>
          <option value="on_review">На проверке</option>
          <option value="closed">Закрыт</option>
          <option value="canceled">Отменён</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="defectAssignee" class="form-label">Исполнитель</label>
        <select
          class="form-control"
          id="defectAssignee"
          v-model="defectAssigneeId"
        >
          <option value="">Не назначен</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.email }}
          </option>
        </select>
      </div>
      <div class="mb-3">
        <label for="defectDueDate" class="form-label">Срок</label>
        <input
          type="date"
          class="form-control"
          id="defectDueDate"
          v-model="defectDueDate"
        />
      </div>
      <div class="mb-3">
        <label for="defectAttachments" class="form-label">Вложения (URL)</label>
        <input
          type="text"
          class="form-control"
          id="defectAttachments"
          v-model="defectAttachments"
          placeholder="Введите URL через запятую (например, file1.jpg, file2.pdf)"
        />
      </div>
      <button type="submit" class="btn btn-primary mb-4">Добавить дефект</button>
    </form>

    <!-- Форма редактирования дефекта -->
    <div v-if="editingDefect">
      <h3>Редактировать дефект #{{ editingDefect.id }}</h3>
      <form @submit.prevent="updateDefect">
        <div class="mb-3">
          <label for="editDefectDescription" class="form-label">Описание дефекта</label>
          <textarea
            class="form-control"
            id="editDefectDescription"
            v-model.trim="editDefectDescription"
            placeholder="Введите описание дефекта"
            required
          ></textarea>
        </div>
        <div class="mb-3">
          <label for="editDefectPriority" class="form-label">Приоритет</label>
          <select
            class="form-control"
            id="editDefectPriority"
            v-model="editDefectPriority"
            required
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="editDefectStatus" class="form-label">Статус</label>
          <select
            class="form-control"
            id="editDefectStatus"
            v-model="editDefectStatus"
            required
          >
            <option value="new">Новый</option>
            <option value="in_work">В работе</option>
            <option value="on_review">На проверке</option>
            <option value="closed">Закрыт</option>
            <option value="canceled">Отменён</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="editDefectAssignee" class="form-label">Исполнитель</label>
          <select
            class="form-control"
            id="editDefectAssignee"
            v-model="editDefectAssigneeId"
          >
            <option value="">Не назначен</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.email }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label for="editDefectDueDate" class="form-label">Срок</label>
          <input
            type="date"
            class="form-control"
            id="editDefectDueDate"
            v-model="editDefectDueDate"
          />
        </div>
        <div class="mb-3">
          <label for="editDefectAttachments" class="form-label">Вложения (URL)</label>
          <input
            type="text"
            class="form-control"
            id="editDefectAttachments"
            v-model="editDefectAttachments"
            placeholder="Введите URL через запятую (например, file1.jpg, file2.pdf)"
          />
        </div>
        <button type="submit" class="btn btn-success mb-4">Сохранить</button>
        <button type="button" class="btn btn-secondary mb-4 ms-2" @click="cancelEditDefect">Отмена</button>
      </form>
    </div>

    <!-- Кнопки экспорта дефектов -->
    <div v-if="defects.length > 0" class="mb-4">
      <button class="btn btn-info me-2" @click="exportDefects('csv')">Экспорт дефектов в CSV</button>
      <button class="btn btn-info" @click="exportDefects('excel')">Экспорт дефектов в Excel</button>
    </div>

    <!-- Список дефектов -->
    <h3>Дефекты проекта</h3>
    <div v-if="defects.length > 0">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Описание</th>
            <th>Приоритет</th>
            <th>Статус</th>
            <th>Исполнитель</th>
            <th>Срок</th>
            <th>Вложения</th>
            <th>Дата создания</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="defect in defects" :key="defect.id">
            <td>{{ defect.description }}</td>
            <td>{{ defect.priority }}</td>
            <td>{{ {
              'new': 'Новый',
              'in_work': 'В работе',
              'on_review': 'На проверке',
              'closed': 'Закрыт',
              'canceled': 'Отменён'
            }[defect.status] || defect.status }}</td>
            <td>{{ defect.assigneeEmail || '-' }}</td>
            <td>{{ defect.dueDate ? new Date(defect.dueDate).toLocaleDateString() : '-' }}</td>
            <td>{{ defect.attachments || '-' }}</td>
            <td>{{ new Date(defect.createdAt).toLocaleDateString() }}</td>
            <td>
              <button class="btn btn-sm btn-warning me-2" @click="startEditDefect(defect)">Редактировать</button>
              <button class="btn btn-sm btn-danger" @click="deleteDefect(defect.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>У проекта пока нет дефектов.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Defects',
  data() {
    return {
      defectDescription: '',
      defectPriority: 'medium',
      defectStatus: 'new',
      defectAssigneeId: '',
      defectDueDate: '',
      defectAttachments: '',
      editDefectDescription: '',
      editDefectPriority: 'medium',
      editDefectStatus: 'new',
      editDefectAssigneeId: '',
      editDefectDueDate: '',
      editDefectAttachments: '',
      editingDefect: null,
      defects: [],
      users: []
    };
  },
  methods: {
    goBack() {
      this.$router.push('/projects');
    },
    async createDefect() {
      try {
        const response = await axios.post('http://localhost:3000/api/defects', {
          projectId: this.$route.params.projectId,
          description: this.defectDescription,
          priority: this.defectPriority,
          status: this.defectStatus,
          assigneeId: this.defectAssigneeId || null,
          dueDate: this.defectDueDate ? new Date(this.defectDueDate).getTime() : null,
          attachments: this.defectAttachments ? this.defectAttachments.split(',').map(url => url.trim()) : null
        }, { withCredentials: true });
        alert(`Дефект создан: ${response.data.message}`);
        this.defectDescription = '';
        this.defectPriority = 'medium';
        this.defectStatus = 'new';
        this.defectAssigneeId = '';
        this.defectDueDate = '';
        this.defectAttachments = '';
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка создания дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchDefects() {
      try {
        const response = await axios.get(`http://localhost:3000/api/defects?projectId=${this.$route.params.projectId}`, { withCredentials: true });
        this.defects = response.data.defects.map(defect => ({
          ...defect,
          assigneeEmail: response.data.users.find(user => user.id === defect.assigneeId)?.email || null
        }));
      } catch (error) {
        alert(`Ошибка загрузки дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    startEditDefect(defect) {
      console.log('Начало редактирования дефекта:', defect);
      this.editingDefect = defect;
      this.editDefectDescription = defect.description;
      this.editDefectPriority = defect.priority;
      this.editDefectStatus = defect.status;
      this.editDefectAssigneeId = defect.assigneeId || '';
      this.editDefectDueDate = defect.dueDate ? new Date(defect.dueDate).toISOString().split('T')[0] : '';
      this.editDefectAttachments = defect.attachments ? defect.attachments.join(', ') : '';
    },
    async updateDefect() {
      try {
        console.log('Редактирование дефекта:', { id: this.editingDefect.id, description: this.editDefectDescription, status: this.editDefectStatus });
        const response = await axios.put(`http://localhost:3000/api/defects/${this.editingDefect.id}`, {
          description: this.editDefectDescription,
          priority: this.editDefectPriority,
          status: this.editDefectStatus,
          assigneeId: this.editDefectAssigneeId || null,
          dueDate: this.editDefectDueDate ? new Date(this.editDefectDueDate).getTime() : null,
          attachments: this.editDefectAttachments ? this.editDefectAttachments.split(',').map(url => url.trim()) : null
        }, { withCredentials: true });
        alert(`Дефект обновлён: ${response.data.message}`);
        this.editingDefect = null;
        this.editDefectDescription = '';
        this.editDefectPriority = 'medium';
        this.editDefectStatus = 'new';
        this.editDefectAssigneeId = '';
        this.editDefectDueDate = '';
        this.editDefectAttachments = '';
        this.fetchDefects();
      } catch (error) {
        console.error('Ошибка обновления дефекта:', error.response?.data || error.message);
        alert(`Ошибка обновления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    cancelEditDefect() {
      this.editingDefect = null;
      this.editDefectDescription = '';
      this.editDefectPriority = 'medium';
      this.editDefectStatus = 'new';
      this.editDefectAssigneeId = '';
      this.editDefectDueDate = '';
      this.editDefectAttachments = '';
    },
    async deleteDefect(defectId) {
      if (!confirm('Вы уверены, что хотите удалить дефект?')) {
        return;
      }
      try {
        const response = await axios.delete(`http://localhost:3000/api/defects/${defectId}`, { withCredentials: true });
        alert(`Дефект удалён: ${response.data.message}`);
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка удаления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async exportDefects(format) {
      try {
        const response = await axios.get(`http://localhost:3000/api/export/defects?projectId=${this.$route.params.projectId}&format=${format}`, {
          withCredentials: true,
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `defects_${this.$route.params.projectId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(`Ошибка экспорта дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:3000/api/users', { withCredentials: true });
        this.users = response.data.users;
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    }
  },
  mounted() {
    this.fetchDefects();
    this.fetchUsers();
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
.table {
  margin-top: 20px;
}
</style>
```